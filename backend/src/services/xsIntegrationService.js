/**
 * XS Integration Service
 * Mock implementation of Shoprite/Checkers Xtra Savings API
 * In production, this would call actual Shoprite API endpoints
 */

const { XSCard } = require('../models');
const logger = require('../utils/logger');

class XSIntegrationService {
  /**
   * Validate XS Card
   * @param {string} cardNumber - XS card number
   * @returns {Promise<Object>} Card validation result
   */
  async validateCard(cardNumber) {
    try {
      logger.info(`[XS API Mock] Validating card: ${cardNumber}`);

      const card = await XSCard.findOne({ where: { card_number: cardNumber } });

      if (!card) {
        return {
          valid: false,
          error: 'Card not found in system'
        };
      }

      if (!card.is_active) {
        return {
          valid: false,
          error: card.blocked_reason || 'Card is inactive'
        };
      }

      // Update last activity
      card.last_activity = new Date();
      await card.save();

      return {
        valid: true,
        card: {
          card_number: card.card_number,
          customer_name: card.customer_name,
          phone_number: card.phone_number,
          points_balance: card.points_balance,
          tier: card.tier,
          total_trolley_returns: card.total_trolley_returns,
          consecutive_returns: card.consecutive_returns
        }
      };
    } catch (error) {
      logger.error('[XS API Mock] Card validation error:', error);
      throw new Error('Failed to validate XS card');
    }
  }

  /**
   * Get customer profile by card number
   * @param {string} cardNumber - XS card number
   * @returns {Promise<Object>} Customer profile
   */
  async getCustomerProfile(cardNumber) {
    try {
      const card = await XSCard.findOne({ where: { card_number: cardNumber } });

      if (!card) {
        throw new Error('Card not found');
      }

      return {
        card_number: card.card_number,
        customer_name: card.customer_name,
        email: card.email,
        phone_number: card.phone_number,
        points_balance: card.points_balance,
        tier: card.tier,
        total_trolley_returns: card.total_trolley_returns,
        consecutive_returns: card.consecutive_returns,
        is_active: card.is_active
      };
    } catch (error) {
      logger.error('[XS API Mock] Get profile error:', error);
      throw error;
    }
  }

  /**
   * Allocate points to customer's XS card
   * @param {string} cardNumber - XS card number
   * @param {number} points - Points to allocate
   * @param {string} reason - Reason for point allocation
   * @returns {Promise<Object>} Allocation result
   */
  async allocatePoints(cardNumber, points, reason = 'Trolley return') {
    try {
      logger.info(`[XS API Mock] Allocating ${points} points to card ${cardNumber} - Reason: ${reason}`);

      const card = await XSCard.findOne({ where: { card_number: cardNumber } });

      if (!card) {
        throw new Error('Card not found');
      }

      // Update points balance
      card.points_balance += points;
      await card.save();

      // In production, this would return a transaction ID from Shoprite's system
      const mockTransactionId = `XS-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        transaction_id: mockTransactionId,
        points_allocated: points,
        new_balance: card.points_balance,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('[XS API Mock] Point allocation error:', error);
      throw new Error('Failed to allocate points');
    }
  }

  /**
   * Deduct points from customer's XS card (for penalties)
   * @param {string} cardNumber - XS card number
   * @param {number} points - Points to deduct
   * @param {string} reason - Reason for deduction
   * @returns {Promise<Object>} Deduction result
   */
  async deductPoints(cardNumber, points, reason = 'Late return penalty') {
    try {
      logger.info(`[XS API Mock] Deducting ${points} points from card ${cardNumber} - Reason: ${reason}`);

      const card = await XSCard.findOne({ where: { card_number: cardNumber } });

      if (!card) {
        throw new Error('Card not found');
      }

      // Prevent negative balance
      const deduction = Math.min(points, card.points_balance);
      card.points_balance -= deduction;
      await card.save();

      const mockTransactionId = `XS-DED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        transaction_id: mockTransactionId,
        points_deducted: deduction,
        requested_deduction: points,
        new_balance: card.points_balance,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('[XS API Mock] Point deduction error:', error);
      throw new Error('Failed to deduct points');
    }
  }

  /**
   * Update customer statistics (trolley returns, streaks, tier)
   * @param {string} cardNumber - XS card number
   * @param {Object} updates - Statistics to update
   * @returns {Promise<Object>} Update result
   */
  async updateCustomerStats(cardNumber, updates) {
    try {
      const card = await XSCard.findOne({ where: { card_number: cardNumber } });

      if (!card) {
        throw new Error('Card not found');
      }

      if (updates.incrementTotalReturns) {
        card.total_trolley_returns += 1;
      }

      if (updates.consecutiveReturns !== undefined) {
        card.consecutive_returns = updates.consecutiveReturns;
      }

      // Auto-upgrade tier based on total returns
      if (card.total_trolley_returns >= 100 && card.tier !== 'diamond') {
        card.tier = 'diamond';
        logger.info(`[XS API Mock] Customer ${cardNumber} upgraded to Diamond tier!`);
      } else if (card.total_trolley_returns >= 50 && card.tier === 'silver') {
        card.tier = 'gold';
        logger.info(`[XS API Mock] Customer ${cardNumber} upgraded to Gold tier!`);
      } else if (card.total_trolley_returns >= 20 && card.tier === 'bronze') {
        card.tier = 'silver';
        logger.info(`[XS API Mock] Customer ${cardNumber} upgraded to Silver tier!`);
      }

      await card.save();

      return {
        success: true,
        total_trolley_returns: card.total_trolley_returns,
        consecutive_returns: card.consecutive_returns,
        tier: card.tier
      };
    } catch (error) {
      logger.error('[XS API Mock] Stats update error:', error);
      throw error;
    }
  }

  /**
   * Block/suspend an XS card
   * @param {string} cardNumber - XS card number
   * @param {string} reason - Reason for blocking
   * @returns {Promise<Object>} Block result
   */
  async blockCard(cardNumber, reason) {
    try {
      logger.warn(`[XS API Mock] Blocking card ${cardNumber} - Reason: ${reason}`);

      const card = await XSCard.findOne({ where: { card_number: cardNumber } });

      if (!card) {
        throw new Error('Card not found');
      }

      card.is_active = false;
      card.blocked_reason = reason;
      await card.save();

      return {
        success: true,
        card_number: cardNumber,
        blocked: true,
        reason: reason,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('[XS API Mock] Card block error:', error);
      throw error;
    }
  }

  /**
   * Unblock/reactivate an XS card
   * @param {string} cardNumber - XS card number
   * @returns {Promise<Object>} Unblock result
   */
  async unblockCard(cardNumber) {
    try {
      logger.info(`[XS API Mock] Unblocking card ${cardNumber}`);

      const card = await XSCard.findOne({ where: { card_number: cardNumber } });

      if (!card) {
        throw new Error('Card not found');
      }

      card.is_active = true;
      card.blocked_reason = null;
      await card.save();

      return {
        success: true,
        card_number: cardNumber,
        blocked: false,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('[XS API Mock] Card unblock error:', error);
      throw error;
    }
  }

  /**
   * Create a new mock XS card (for demo purposes)
   * @param {Object} cardData - Card data
   * @returns {Promise<Object>} Created card
   */
  async createMockCard(cardData) {
    try {
      const card = await XSCard.create({
        card_number: cardData.card_number,
        customer_name: cardData.customer_name,
        phone_number: cardData.phone_number,
        email: cardData.email || null,
        points_balance: cardData.points_balance || 0,
        tier: cardData.tier || 'bronze'
      });

      logger.info(`[XS API Mock] Created mock card: ${card.card_number}`);

      return {
        success: true,
        card: card.toJSON()
      };
    } catch (error) {
      logger.error('[XS API Mock] Card creation error:', error);
      throw error;
    }
  }
}

module.exports = new XSIntegrationService();
