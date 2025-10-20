import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException
from datetime import datetime

# Importamos la función a testear y su request model
from app.routes.another_victim import another_victim, VictimRequest
# Importamos constantes del modelo (estados de carta, turno, acción, etc.)
from app.db.models import CardState, TurnStatus, ActionType, ActionResult


class TestAnotherVictim:
    """Suite de tests para el endpoint another_victim"""

    # ---------- FIXTURES (datos falsos reutilizables en los tests) ----------

    @pytest.fixture
    def mock_db(self):
        """Mock de la sesión de base de datos."""
        # Se simula el objeto Session de SQLAlchemy
        db = Mock()
        db.add = Mock()
        db.commit = Mock()
        db.flush = Mock()
        db.rollback = Mock()
        return db

    @pytest.fixture
    def mock_room(self):
        """Mock de una sala existente."""
        room = Mock()
        room.id = 1
        room.id_game = 1
        return room

    @pytest.fixture
    def mock_game(self):
        """Mock de un juego activo."""
        game = Mock()
        game.id = 1
        game.player_turn_id = 10  # jugador que tiene el turno
        return game

    @pytest.fixture
    def mock_actor(self):
        """Mock del jugador que realiza la acción."""
        actor = Mock()
        actor.id = 10
        actor.name = "Actor"
        actor.id_room = 1
        return actor

    @pytest.fixture
    def mock_victim(self):
        """Mock del jugador víctima."""
        victim = Mock()
        victim.id = 20
        victim.name = "Victim"
        victim.id_room = 1
        return victim

    @pytest.fixture
    def mock_turn(self):
        """Mock de un turno activo en curso."""
        turn = Mock()
        turn.id = 1
        turn.id_game = 1
        turn.player_id = 10
        turn.status = TurnStatus.IN_PROGRESS
        return turn

    @pytest.fixture
    def mock_victim_set_cards(self):
        """Mock del set de cartas que el jugador víctima tiene."""
        cards = []
        for i in range(3):  # crea 3 cartas falsas
            card = Mock()
            card.id = i + 1
            card.player_id = 20  # pertenece a la víctima
            card.id_game = 1
            card.is_in = CardState.DETECTIVE_SET
            card.position = 1
            card.card = Mock()
            card.card.name = f"Card {i}"
            card.card.type = Mock()
            card.card.type.value = "VICTIM"
            cards.append(card)
        return cards

    @pytest.fixture
    def mock_another_victim_card(self):
        """Mock de la carta 'Another Victim' que usa el actor."""
        card = Mock()
        card.id = 100
        card.player_id = 10
        card.id_game = 1
        card.is_in = CardState.HAND
        card.card = Mock()
        card.card.id = 13  # ID de la carta especial
        return card

    # ---------- UTILIDAD PARA SIMULAR CONSULTAS SQL ----------
    def setup_query_chain(self, mock_db, responses):
        """
        Configura una cadena de respuestas para las queries del mock_db.query().
        Cada llamada a .first() o .all() devolverá los valores de 'responses' en orden.
        """

        response_iter = iter(responses)

        def create_query_mock(*args, **kwargs):
            mock_query = Mock()

            # Mocks para los métodos de SQLAlchemy
            def mock_filter(*filter_args, **filter_kwargs):
                mock_query.filter = Mock(return_value=mock_query)
                return mock_query

            def mock_join(*join_args, **join_kwargs):
                mock_query.join = Mock(return_value=mock_query)
                return mock_query

            def mock_order_by(*order_args, **order_kwargs):
                mock_query.order_by = Mock(return_value=mock_query)
                return mock_query

            def mock_first():
                # Devuelve el siguiente valor de la lista de respuestas
                try:
                    return next(response_iter)
                except StopIteration:
                    return None

            def mock_all():
                # Devuelve una lista con el siguiente valor de responses
                try:
                    result = next(response_iter)
                    return result if isinstance(result, list) else [result]
                except StopIteration:
                    return []

            # Vinculamos los mocks al objeto query
            mock_query.filter = mock_filter
            mock_query.join = mock_join
            mock_query.order_by = mock_order_by
            mock_query.first = mock_first
            mock_query.all = mock_all

            return mock_query

        # Sobrescribimos el método query del mock_db
        mock_db.query = create_query_mock

    # ---------- TESTS UNITARIOS / FUNCIONALES ----------

    @pytest.mark.asyncio
    async def test_another_victim_success(
        self, mock_db, mock_room, mock_game, mock_actor, 
        mock_victim, mock_turn, mock_victim_set_cards, mock_another_victim_card
    ):
        """✅ Caso exitoso: el jugador roba un set correctamente."""

        # Configuramos la cadena de respuestas simuladas en orden de uso
        self.setup_query_chain(mock_db, [
            mock_room,                  # Consulta de la sala
            mock_game,                  # Consulta del juego
            mock_actor,                 # Jugador actor
            mock_turn,                  # Turno activo
            mock_victim,                # Jugador víctima
            mock_victim_set_cards,      # Cartas del set de la víctima
            mock_another_victim_card,   # Carta Another Victim
            (5,)                        # Última posición de descarte
        ])

        # Mockeamos el WebSocket service y sus métodos async
        mock_ws = AsyncMock()
        mock_ws.notificar_event_step_update = AsyncMock()
        mock_ws.notificar_event_action_complete = AsyncMock()
        mock_ws.notificar_estado_publico = AsyncMock()
        mock_ws.notificar_estados_privados = AsyncMock()

        # Parchamos dependencias dentro del endpoint
        with patch('app.routes.another_victim.get_websocket_service', return_value=mock_ws), \
             patch('app.routes.another_victim.build_complete_game_state', return_value={
                 "game_id": 1, "status": "INGAME", "turno_actual": 10,
                 "jugadores": [], "mazos": {}, "estados_privados": {}
             }):

            request = VictimRequest(originalOwnerId=20, setPosition=1)

            # Ejecutamos la función asíncrona
            response = await another_victim(
                room_id=1,
                request=request,
                actor_user_id=10,
                db=mock_db
            )

            # 🔍 Validaciones de resultado
            assert response.success is True
            assert response.transferredSet.position == 1
            assert response.transferredSet.newOwnerId == 10
            assert len(response.transferredSet.cards) == 3

            # Verificamos que el commit fue llamado
            mock_db.commit.assert_called_once()

            # Que se registraron varias acciones (eventos)
            assert mock_db.add.call_count >= 3

            # Que se notificó por WebSocket a todos los canales
            mock_ws.notificar_event_step_update.assert_called_once()
            mock_ws.notificar_event_action_complete.assert_called_once()
            mock_ws.notificar_estado_publico.assert_called_once()
            mock_ws.notificar_estados_privados.assert_called_once()

    # ----- CASOS DE ERROR -----

    @pytest.mark.asyncio
    async def test_room_not_found(self, mock_db):
        """❌ Caso: no existe la sala."""
        self.setup_query_chain(mock_db, [None])
        request = VictimRequest(originalOwnerId=20, setPosition=1)

        with pytest.raises(HTTPException) as exc_info:
            await another_victim(999, request, 10, mock_db)

        assert exc_info.value.status_code == 404
        assert "Room not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_game_not_found(self, mock_db, mock_room):
        """❌ Caso: no existe el juego."""
        self.setup_query_chain(mock_db, [mock_room, None])

        with pytest.raises(HTTPException) as exc_info:
            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_actor_not_found(self, mock_db, mock_room, mock_game):
        """❌ Caso: el jugador actor no se encuentra."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, None])

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

    @pytest.mark.asyncio
    async def test_not_player_turn(self, mock_db, mock_room, mock_game, mock_actor):
        """❌ Caso: no es el turno del jugador que intenta actuar."""
        mock_game.player_turn_id = 999
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor])

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

    @pytest.mark.asyncio
    async def test_no_active_turn(self, mock_db, mock_room, mock_game, mock_actor):
        """❌ Caso: no hay turno activo en curso."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, None])

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

    @pytest.mark.asyncio
    async def test_victim_not_found(self, mock_db, mock_room, mock_game, mock_actor, mock_turn):
        """❌ Caso: la víctima no se encuentra."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, mock_turn, None])

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

    @pytest.mark.asyncio
    async def test_cannot_steal_from_yourself(self, mock_db, mock_room, mock_game, mock_actor, mock_turn):
        """❌ Caso: el jugador intenta robarse a sí mismo."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, mock_turn, mock_actor])

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(10, 1), 10, mock_db)

    @pytest.mark.asyncio
    async def test_no_detective_set_found(self, mock_db, mock_room, mock_game, mock_actor, mock_turn, mock_victim):
        """❌ Caso: el set de detective no existe."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, mock_turn, mock_victim, []])

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(20, 5), 10, mock_db)

    @pytest.mark.asyncio
    async def test_invalid_detective_set(self, mock_db, mock_room, mock_game, mock_actor, mock_turn, mock_victim):
        """❌ Caso: el set es inválido (menos de 2 cartas)."""
        single_card = [Mock()]
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, mock_turn, mock_victim, single_card])

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

    @pytest.mark.asyncio
    async def test_database_error_rollback(self, mock_db, mock_room, mock_game, mock_actor, mock_turn, mock_victim, mock_victim_set_cards):
        """❌ Caso: ocurre un error en la base y se hace rollback."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, mock_turn, mock_victim, mock_victim_set_cards, None, (5,)])
        mock_db.commit.side_effect = Exception("Database error")

        with pytest.raises(HTTPException):
            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

        mock_db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_card_transfer_updates(self, mock_db, mock_room, mock_game, mock_actor, mock_turn, mock_victim, mock_victim_set_cards, mock_another_victim_card):
        """✅ Caso: las cartas son transferidas correctamente."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, mock_turn, mock_victim, mock_victim_set_cards, mock_another_victim_card, (5,)])

        mock_ws = AsyncMock()

        with patch('app.routes.another_victim.get_websocket_service', return_value=mock_ws), \
             patch('app.routes.another_victim.build_complete_game_state', return_value={"estados_privados": {}}):

            await another_victim(1, VictimRequest(20, 1), 10, mock_db)

            # Verificamos que todas las cartas cambiaron de dueño
            for card in mock_victim_set_cards:
                assert card.player_id == 10

            # Verificamos que la carta Another Victim se descartó correctamente
            assert mock_another_victim_card.is_in == CardState.DISCARD

    @pytest.mark.asyncio
    async def test_another_victim_without_card_in_hand(self, mock_db, mock_room, mock_game, mock_actor, mock_turn, mock_victim, mock_victim_set_cards):
        """✅ Caso: el jugador no tiene la carta Another Victim, pero el set igual se roba."""
        self.setup_query_chain(mock_db, [mock_room, mock_game, mock_actor, mock_turn, mock_victim, mock_victim_set_cards, None, None])

        mock_ws = AsyncMock()

        with patch('app.routes.another_victim.get_websocket_service', return_value=mock_ws), \
             patch('app.routes.another_victim.build_complete_game_state', return_value={}):

            response = await another_victim(1, VictimRequest(20, 1), 10, mock_db)

            # Debe seguir funcionando correctamente
            assert response.success is True
            for card in mock_victim_set_cards:
                assert card.player_id == 10
