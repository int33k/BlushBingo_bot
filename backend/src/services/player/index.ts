import { IPlayerService } from './IPlayerService';
import { PlayerService } from './PlayerService';

const playerService: IPlayerService = new PlayerService();

export { playerService, IPlayerService, PlayerService };

// Backward compatibility exports
export const playerGameService = playerService;
export const playerConnectionService = playerService;
