import ProfileCard from "../ProfileCard";
import Button from "../Button";
import { useState } from "react";
import { useUser } from '../../context/UserContext.jsx'
import { useGame } from '../../context/GameContext.jsx'

const SelectPlayerModal = ({ onPlayerSelect }) => {

  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const { userState } = useUser()
  const { gameState } = useGame()

  const modalLayout = "fixed inset-0 flex z-50 items-center justify-center bg-black bg-opacity-60";
  const modalContainer =
    "bg-[#1D0000] border-4 border-[#825012] rounded-2xl w-[90%] max-w-3xl p-6 flex flex-col items-center gap-6";
  const playersContainer = "grid grid-cols-2 md:grid-cols-3 gap-4 w-full justify-center";
  const actionMessage = "text-[#FFE0B2] text-xl font-semibold text-center";
  const buttonContainer = "flex gap-4 justify-center w-full";

  const playersToShow = gameState.jugadores.filter((j) => { 
    return j.player_id != userState.id 
  });


  
  // handlers de selectPlayerModal
  const handlePlayerSelect = async (jugadorId) => {
    console.log("SELECTED PLAYER = ", jugadorId);
    
    const { actionInProgress } = gameState.eventCards;
    const currentEventType = actionInProgress?.eventType;
    
    const { current: detectiveAction } = gameState.detectiveAction;
    const detectiveSetType = detectiveAction?.setType;
    const actionId = detectiveAction?.actionId;
    
    // Caso 1: Another Victim (selecting target player for set steal)
    if (currentEventType === 'another_victim') {
      gameDispatch({
        type: 'EVENT_ANOTHER_VICTIM_SELECT_PLAYER',
        payload: jugadorId,
      });
      return;
    }
    
    // Caso 2: Detective Action - Player Selection
    if (detectiveAction && actionId) {
     
      console.log(`Selecting player ${jugadorId} for detective action ${actionId}`);
        
      // Update local state to show we're waiting
      gameDispatch({
        type: 'DETECTIVE_TARGET_CONFIRMED',
        payload: {
          targetPlayerId: jugadorId,
          targetPlayerData: jugadorId,
        },
      });

      console.log(detectiveSetType)

      // si es marple --> seleccionar secreto tamb
      if (detectiveSetType == "marple" || detectiveSetType == "poirot" || detectiveSetType == "pyne") {
        // seleccionar secreto

        gameDispatch({
          type: 'DETECTIVE_PLAYER_SELECTED',
          payload: {
            ...detectiveAction,
            targetPlayerId: jugadorId,
            needsSecret: true,
          },
        })

      } else {
        // si es otro no seleccionar secreto
        try {
          // Call backend - Step 1: Select target player
          const response = await fetch(
            `http://localhost:8000/api/game/${gameState.roomId}/detective-action`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                HTTP_USER_ID: userState.id.toString(),
              },
              body: JSON.stringify({
                actionId: actionId,
                executorId: userState.id,
                targetPlayerId: jugadorId,
                secretId: null, // null for player selection step
              }),
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Backend error:", errorData);
            throw new Error(getErrorMessage(response.status, errorData));
          }
          
          const data = await response.json();
          console.log("Target player selected successfully:", data);

          gameDispatch({
            type: 'DETECTIVE_PLAYER_SELECTED',
            payload: {
              ...detectiveAction,
              targetPlayerId: jugadorId,
              needsSecret: false,
            },
          })
          
          // Backend will emit WebSocket events:
          // - detective_target_selected (to all players)
          // - select_own_secret (to target player only)
          
        } catch (error) {
          console.error('Error selecting target player:', error);
          // Reset to player selection state on error
          gameDispatch({
            type: 'DETECTIVE_SET_SUBMITTED',
            payload: {
              ...detectiveAction,
              allowedPlayers: gameState.detectiveAction.allowedPlayers,
              secretsPool: gameState.detectiveAction.secretsPool,
            },
          });
          setError(error.message);
          setTimeout(() => setError(null), 5000);
        }
      }
    }  
  };
  
  const confirmSelection = () => {
    if (selectedPlayerId) onPlayerSelect(selectedPlayerId);
  }

  return (
    <div className={modalLayout}>
      <div className={modalContainer}>

        {/* Lista de jugadores (solo si corresponde) */}
          <div className={playersContainer}>
            {playersToShow.map((jugador) => (
              <div
                key={jugador.player_id}
                onClick={() => setSelectedPlayerId(jugador.player_id)}
                className={`cursor-pointer hover:scale-105 transition-all ${
                  selectedPlayerId === jugador.player_id
                    ? "ring-4 ring-[#FFD700]"
                    : ""
                }`}
              >
                <ProfileCard
                  name={jugador.name}
                  avatar={jugador.avatar}
                  birthdate={new Date(jugador.birthdate).toLocaleDateString()}
                />
              </div>
            ))}
          </div>

        {/* Mensaje de acción */}
        <div className={actionMessage}>
          <h2>Selecciona un jugador</h2>
        </div>

        {/* Botones de confirmación/cancelación */}
        <div className={buttonContainer}>
          <Button 
            onClick={() => confirmSelection()} 
            title="Confirmar"
            disabled={false}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectPlayerModal;