/**
 * Spike Detection Utility (Bonus Feature)
 * 
 * Computes view velocity (views per hour) and determines if a submission
 * should be flagged for suspicious / fraudulent view growth.
 */

export interface SpikeDetectionResult {
  isFlagged: boolean;
  flagReason: string | null;
  viewVelocity: number;
}

export const VELOCITY_THRESHOLD_VIEWS_PER_HOUR = 50000;
export const SUDDEN_JUMP_THRESHOLD_VIEWS = 20000;
export const SUDDEN_JUMP_MAX_HOURS = 0.1; // ~6 minutes

/**
 * Evaluates whether a view update represents an unnatural spike.
 *
 * @param oldViews Previous view count
 * @param newViews Newly reported view count
 * @param lastUpdate Timestamp of the previous view update (or creation time)
 * @param currentUpdate Current timestamp (default: Date.now())
 */
export function detectViewSpike(
  oldViews: number,
  newViews: number,
  lastUpdate: Date | number,
  currentUpdate: Date | number = Date.now()
): SpikeDetectionResult {
  const deltaViews = newViews - oldViews;

  if (deltaViews <= 0) {
    return {
      isFlagged: false,
      flagReason: null,
      viewVelocity: 0,
    };
  }

  const lastTime = typeof lastUpdate === 'number' ? lastUpdate : lastUpdate.getTime();
  const currentTime = typeof currentUpdate === 'number' ? currentUpdate : currentUpdate.getTime();
  const elapsedMillis = Math.max(currentTime - lastTime, 0);
  const elapsedHours = elapsedMillis / (1000 * 60 * 60);

  // Use a minimum of 1 minute (1/60 hr) to avoid division by zero on rapid updates
  const effectiveHours = Math.max(elapsedHours, 1 / 60);
  const viewVelocity = Math.round(deltaViews / effectiveHours);

  // Check against thresholds
  const isVelocityExceeded = viewVelocity > VELOCITY_THRESHOLD_VIEWS_PER_HOUR;
  const isSuddenJump = deltaViews >= SUDDEN_JUMP_THRESHOLD_VIEWS && elapsedHours <= SUDDEN_JUMP_MAX_HOURS;

  if (isVelocityExceeded || isSuddenJump) {
    const minutesElapsed = (elapsedHours * 60).toFixed(1);
    const reason = `Unusual view spike detected: +${deltaViews.toLocaleString()} views within ${minutesElapsed} mins (~${viewVelocity.toLocaleString()} views/hour)`;
    return {
      isFlagged: true,
      flagReason: reason,
      viewVelocity,
    };
  }

  return {
    isFlagged: false,
    flagReason: null,
    viewVelocity,
  };
}
