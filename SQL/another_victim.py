# ===========================================
# 📦 Imports necesarios
# ===========================================
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from pydantic import BaseModel
from app.db.models import (
    Game, Room, CardsXGame, CardState, Player, ActionsPerTurn,
    ActionType, ActionResult, Turn, TurnStatus, Card, ActionName
)
from app.sockets.socket_service import get_websocket_service
from app.services.game_status_service import build_complete_game_state
from datetime import datetime
import logging

# Logger para registrar eventos del endpoint
logger = logging.getLogger(__name__)

# Creamos el router de FastAPI con prefijo y tag
router = APIRouter(prefix="/api/game", tags=["Games"])

# ===========================================
# Dependencias y modelos
# ===========================================

def get_db():
    """Dependencia que abre y cierra una sesión de base de datos automáticamente."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class VictimRequest(BaseModel):
    """Datos que envía el cliente al endpoint."""
    originalOwnerId: int   # Jugador víctima
    setPosition: int       # Posición del set a robar

class CardSummary(BaseModel):
    """Resumen de una carta dentro del set transferido."""
    cardId: int
    name: str
    type: str

class TransferredSet(BaseModel):
    """Representa el set de cartas robado."""
    position: int
    cards: list[CardSummary]
    newOwnerId: int
    originalOwnerId: int

class VictimResponse(BaseModel):
    """Respuesta completa del endpoint."""
    success: bool
    transferredSet: TransferredSet

# ===========================================
# Endpoint: another_victim
# ===========================================

@router.post("/{room_id}/event/another-victim", response_model=VictimResponse, status_code=200)
async def another_victim(
    room_id: int,
    request: VictimRequest,
    actor_user_id: int = Header(..., alias="HTTP_USER_ID"),
    db: Session = Depends(get_db)
):
    """
    Endpoint que procesa la carta 'Another Victim':
    Un jugador (actor) roba un set de detective de otro jugador (víctima).
    """
    logger.info(f"POST /game/{room_id}/event/another-victim received")
    
    try:
        # ------------------------------------------
        # 1️⃣ Validaciones iniciales
        # ------------------------------------------
        
        # Verificar que exista la sala
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        # Verificar que exista el juego asociado
        game = db.query(Game).filter(Game.id == room.id_game).first()
        if not game:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

        # Buscar el jugador actor (el que roba)
        actor = db.query(Player).filter(
            Player.id == actor_user_id,
            Player.id_room == room_id
        ).first()
        if not actor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Actor player not found")

        # Verificar que sea su turno
        if game.player_turn_id != actor.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your turn")

        # Verificar que exista un turno activo
        current_turn = db.query(Turn).filter(
            Turn.id_game == game.id,
            Turn.player_id == actor.id,
            Turn.status == TurnStatus.IN_PROGRESS
        ).first()
        if not current_turn:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No active turn found")

        # Buscar la víctima
        victim = db.query(Player).filter(
            Player.id == request.originalOwnerId,
            Player.id_room == room_id
        ).first()
        if not victim:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target player not found")

        # Evitar robarse a sí mismo
        if actor.id == victim.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot steal from yourself")

        # ------------------------------------------
        # 2️⃣ Obtener el set de detective de la víctima
        # ------------------------------------------
        victim_set_cards = db.query(CardsXGame).filter(
            CardsXGame.player_id == victim.id,
            CardsXGame.id_game == game.id,
            CardsXGame.is_in == CardState.DETECTIVE_SET,
            CardsXGame.position == request.setPosition
        ).all()

        if not victim_set_cards:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No detective set found at position {request.setPosition} for player {request.originalOwnerId}"
            )

        if len(victim_set_cards) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid detective set: must have at least 2 cards"
            )

        # ------------------------------------------
        # 3️⃣ Descartar la carta "Another Victim" si existe
        # ------------------------------------------
        another_victim_card = db.query(CardsXGame).join(Card).filter(
            CardsXGame.player_id == actor.id,
            CardsXGame.id_game == game.id,
            CardsXGame.is_in == CardState.HAND,
            Card.name == "Another Victim"
        ).first()

        if another_victim_card:
            max_discard_position = db.query(CardsXGame.position).filter(
                CardsXGame.id_game == game.id,
                CardsXGame.is_in == CardState.DISCARD
            ).order_by(CardsXGame.position.desc()).first()

            next_discard_position = (max_discard_position[0] + 1) if max_discard_position else 1

            # Mover la carta al mazo de descartes
            another_victim_card.is_in = CardState.DISCARD
            another_victim_card.position = next_discard_position
            another_victim_card.hidden = False
            another_victim_card.player_id = None

        # ------------------------------------------
        # 4️⃣ Registrar acciones en ActionsPerTurn
        # ------------------------------------------
        # Evento Another Victim
        action_event = ActionsPerTurn(
            id_game=game.id,
            turn_id=current_turn.id,
            player_id=actor.id,
            action_name=ActionName.ANOTHER_VICTIM,
            action_type=ActionType.EVENT_CARD,
            result=ActionResult.SUCCESS,
            action_time=datetime.now(),
            selected_card_id=another_victim_card.id if another_victim_card else None,
            player_target=victim.id,
            selected_set_id=request.setPosition
        )
        db.add(action_event)
        db.flush()

        # Acción de robar el set
        action_steal = ActionsPerTurn(
            id_game=game.id,
            turn_id=current_turn.id,
            player_id=actor.id,
            action_type=ActionType.STEAL_SET,
            result=ActionResult.SUCCESS,
            action_time=datetime.now(),
            player_source=victim.id,
            player_target=actor.id,
            selected_set_id=request.setPosition,
            parent_action_id=action_event.id
        )
        db.add(action_steal)
        db.flush()

        # ------------------------------------------
        # 5️⃣ Transferir cartas al actor
        # ------------------------------------------
        for card in victim_set_cards:
            card.player_id = actor.id  # Transferir propiedad

            action_move = ActionsPerTurn(
                id_game=game.id,
                turn_id=current_turn.id,
                player_id=actor.id,
                action_type=ActionType.MOVE_CARD,
                result=ActionResult.SUCCESS,
                action_time=datetime.now(),
                selected_card_id=card.id,
                parent_action_id=action_steal.id
            )
            db.add(action_move)

        db.commit()  # Guardar todo en la DB

        # ------------------------------------------
        # 6️⃣ Preparar respuesta
        # ------------------------------------------
        transferred_cards = [
            CardSummary(
                cardId=card.id,
                name=card.card.name if card.card else "Unknown",
                type=card.card.type.value if card.card and card.card.type else "UNKNOWN"
            )
            for card in victim_set_cards
        ]

        response = VictimResponse(
            success=True,
            transferredSet=TransferredSet(
                position=request.setPosition,
                cards=transferred_cards,
                newOwnerId=actor.id,
                originalOwnerId=victim.id
            )
        )

        # ------------------------------------------
        # 7️⃣ Notificaciones WebSocket
        # ------------------------------------------
        ws_service = get_websocket_service()

        # Notificar evento del paso "set_stolen"
        await ws_service.notificar_event_step_update(
            room_id=room_id,
            player_id=actor.id,
            event_type="another_victim",
            step="set_stolen",
            message=f"El jugador {actor.name} robo un set de {victim.name}",
            data={
                "fromPlayerId": victim.id,
                "fromPlayerName": victim.name,
                "toPlayerId": actor.id,
                "toPlayerName": actor.name,
                "setPosition": request.setPosition,
                "cardCount": len(victim_set_cards),
                "transferredSet": {
                    "position": request.setPosition,
                    "cards": [
                        {"cardId": c.cardId, "name": c.name, "type": c.type}
                        for c in transferred_cards
                    ],
                    "newOwnerId": actor.id,
                    "originalOwnerId": victim.id
                }
            }
        )
        logger.info("Se emitió el evento 'set_stolen'")

        # Notificar fin de acción
        await ws_service.notificar_event_action_complete(
            room_id=room_id,
            player_id=actor.id,
            event_type="another_victim"
        )
        logger.info("Se emitió fin de acción")

        # Obtener estado completo del juego
        game_state = build_complete_game_state(db, game.id)

        # Notificar estado público
        await ws_service.notificar_estado_publico(
            room_id=room_id,
            game_state=game_state
        )

        # Notificar estados privados
        await ws_service.notificar_estados_privados(
            room_id=room_id,
            estados_privados=game_state.get("estados_privados", {})
        )

        return response

    # ------------------------------------------
    # Manejo de errores
    # ------------------------------------------
    except HTTPException:
        raise  # Re-lanza excepciones HTTP ya definidas
    except Exception as e:
        logger.error(f"Error in another_victim: {e}", exc_info=True)
        db.rollback()  # Revertir cambios si falla algo
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error transferring detective set: {str(e)}"
        )
