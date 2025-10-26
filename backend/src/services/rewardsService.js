/**
 * Rewards Service
 * Gamification engine for trolley return rewards
 */

const logger = require('../utils/logger');

class RewardsService {
  constructor() {
    // Base points configuration
    this.BASE_POINTS = 5;
    this.QUICK_RETURN_BONUS = 5; // Bonus for returning within 1 hour
    this.STREAK_BONUS = 10; // Bonus for consecutive returns
    this.TIER_MULTIPLIERS = {
      bronze: 1.0,
      silver: 1.5,
      gold: 2.0,
      diamond: 2.5
    };
  }

  /**
   * Calculate points for trolley return
   * @param {Object} params - Calculation parameters
   * @param {number} params.durationMinutes - How long trolley was used
   * @param {string} params.tier - Customer tier (bronze, silver, gold, diamond)
   * @param {number} params.consecutiveReturns - Current streak count
   * @param {boolean} params.isOnTime - Whether returned on time
   * @returns {Object} Points breakdown
   */
  calculatePoints({ durationMinutes, tier = 'bronze', consecutiveReturns = 0, isOnTime = true }) {
    let points = this.BASE_POINTS;
    let bonusPoints = 0;
    const breakdown = {
      base: this.BASE_POINTS,
      bonuses: []
    };

    // Quick return bonus (returned within 1 hour)
    if (durationMinutes <= 60) {
      bonusPoints += this.QUICK_RETURN_BONUS;
      breakdown.bonuses.push({
        type: 'quick_return',
        description: 'Quick return bonus (<1 hour)',
        points: this.QUICK_RETURN_BONUS
      });
    }

    // Streak bonus (every 5 consecutive returns)
    if (consecutiveReturns > 0 && consecutiveReturns % 5 === 0) {
      bonusPoints += this.STREAK_BONUS;
      breakdown.bonuses.push({
        type: 'streak',
        description: `${consecutiveReturns} consecutive returns streak!`,
        points: this.STREAK_BONUS
      });
    }

    // Special milestone bonuses
    if (consecutiveReturns === 10) {
      bonusPoints += 20;
      breakdown.bonuses.push({
        type: 'milestone',
        description: '10 returns milestone bonus!',
        points: 20
      });
    } else if (consecutiveReturns === 25) {
      bonusPoints += 50;
      breakdown.bonuses.push({
        type: 'milestone',
        description: '25 returns milestone bonus!',
        points: 50
      });
    } else if (consecutiveReturns === 50) {
      bonusPoints += 100;
      breakdown.bonuses.push({
        type: 'milestone',
        description: '50 returns milestone bonus!',
        points: 100
      });
    }

    // Late return penalty
    if (!isOnTime) {
      bonusPoints -= 10;
      breakdown.bonuses.push({
        type: 'late_penalty',
        description: 'Late return penalty',
        points: -10
      });
    }

    // Calculate subtotal before tier multiplier
    const subtotal = points + bonusPoints;

    // Apply tier multiplier
    const multiplier = this.TIER_MULTIPLIERS[tier] || 1.0;
    const tierBonus = Math.floor(subtotal * (multiplier - 1));

    if (tierBonus > 0) {
      breakdown.bonuses.push({
        type: 'tier_multiplier',
        description: `${tier.toUpperCase()} tier bonus (${multiplier}x)`,
        points: tierBonus
      });
    }

    const totalPoints = subtotal + tierBonus;

    breakdown.subtotal = subtotal;
    breakdown.tier_bonus = tierBonus;
    breakdown.total = totalPoints;
    breakdown.tier = tier;
    breakdown.multiplier = multiplier;

    logger.info(`[Rewards] Calculated ${totalPoints} points for return (Duration: ${durationMinutes}min, Tier: ${tier}, Streak: ${consecutiveReturns})`);

    return breakdown;
  }

  /**
   * Calculate penalty for unreturned trolley
   * @param {Object} params - Penalty parameters
   * @param {number} params.hoursOverdue - Hours past expected return time
   * @param {string} params.tier - Customer tier
   * @returns {Object} Penalty breakdown
   */
  calculatePenalty({ hoursOverdue, tier = 'bronze' }) {
    let penaltyPoints = 0;

    // Graduated penalty system
    if (hoursOverdue <= 24) {
      penaltyPoints = 20; // 1 day late
    } else if (hoursOverdue <= 48) {
      penaltyPoints = 50; // 2 days late
    } else if (hoursOverdue <= 72) {
      penaltyPoints = 100; // 3 days late
    } else {
      penaltyPoints = 200; // More than 3 days late
    }

    // Higher tier = higher penalty (incentive for responsible behavior)
    const multiplier = this.TIER_MULTIPLIERS[tier] || 1.0;
    const adjustedPenalty = Math.floor(penaltyPoints * multiplier);

    return {
      base_penalty: penaltyPoints,
      tier_adjustment: Math.floor(penaltyPoints * (multiplier - 1)),
      total_penalty: adjustedPenalty,
      hours_overdue: hoursOverdue,
      tier: tier
    };
  }

  /**
   * Determine if customer should be blocked
   * @param {Object} customerHistory - Customer's trolley history
   * @returns {Object} Block decision
   */
  shouldBlockCustomer(customerHistory) {
    const { unreturned_count = 0, late_returns_count = 0, total_returns = 0 } = customerHistory;

    // Block if 3+ unreturned trolleys
    if (unreturned_count >= 3) {
      return {
        should_block: true,
        reason: `${unreturned_count} unreturned trolleys. Please return all trolleys to reactivate card.`
      };
    }

    // Block if late return rate > 50% (and at least 10 total returns)
    if (total_returns >= 10) {
      const lateReturnRate = late_returns_count / total_returns;
      if (lateReturnRate > 0.5) {
        return {
          should_block: true,
          reason: `High late return rate (${Math.round(lateReturnRate * 100)}%). Please improve return times to reactivate card.`
        };
      }
    }

    return {
      should_block: false,
      reason: null
    };
  }

  /**
   * Get next tier requirement
   * @param {string} currentTier - Current customer tier
   * @param {number} totalReturns - Total trolley returns
   * @returns {Object} Next tier info
   */
  getNextTierInfo(currentTier, totalReturns) {
    const tierRequirements = {
      bronze: { next: 'silver', required_returns: 20 },
      silver: { next: 'gold', required_returns: 50 },
      gold: { next: 'diamond', required_returns: 100 },
      diamond: { next: null, required_returns: null }
    };

    const current = tierRequirements[currentTier];

    if (!current || !current.next) {
      return {
        current_tier: currentTier,
        next_tier: null,
        returns_needed: 0,
        progress_percentage: 100,
        is_max_tier: true
      };
    }

    const returnsNeeded = Math.max(0, current.required_returns - totalReturns);
    const progressPercentage = Math.min(100, Math.round((totalReturns / current.required_returns) * 100));

    return {
      current_tier: currentTier,
      next_tier: current.next,
      returns_needed: returnsNeeded,
      total_returns: totalReturns,
      required_returns: current.required_returns,
      progress_percentage: progressPercentage,
      is_max_tier: false
    };
  }

  /**
   * Generate personalized reward message
   * @param {Object} rewardData - Reward calculation data
   * @returns {string} Personalized message
   */
  generateRewardMessage(rewardData) {
    const { total, bonuses, tier } = rewardData;
    const messages = [];

    messages.push(`🎉 You earned ${total} XS points!`);

    // Highlight special bonuses
    bonuses.forEach(bonus => {
      if (bonus.type === 'streak') {
        messages.push(`🔥 ${bonus.description}`);
      } else if (bonus.type === 'milestone') {
        messages.push(`🏆 ${bonus.description}`);
      } else if (bonus.type === 'quick_return') {
        messages.push(`⚡ ${bonus.description}`);
      }
    });

    if (tier === 'diamond') {
      messages.push('💎 Diamond tier benefits applied!');
    } else if (tier === 'gold') {
      messages.push('🥇 Gold tier benefits applied!');
    }

    return messages.join(' ');
  }
}

module.exports = new RewardsService();
