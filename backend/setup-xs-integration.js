/**
 * XS Integration Setup Script
 * Run this to set up the XS card integration feature
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { XSCard, CustomerTrolleyAssignment } = require('./src/models');

const setup = async () => {
  try {
    console.log('🚀 Starting XS Card Integration setup...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync only the new tables (don't alter existing ones)
    console.log('\n📊 Creating XS Card tables...');
    await XSCard.sync({ alter: true });
    console.log('✓ xs_cards table ready');

    await CustomerTrolleyAssignment.sync({ alter: true });
    console.log('✓ customer_trolley_assignments table ready');

    // Seed demo data
    console.log('\n🌱 Seeding demo XS cards...');

    const demoCards = [
      {
        card_number: 'XS001234567',
        customer_name: 'Thabo Mkhize',
        phone_number: '+27821234567',
        email: 'thabo.mkhize@example.com',
        points_balance: 150,
        tier: 'bronze',
        total_trolley_returns: 8,
        consecutive_returns: 3,
        is_active: true
      },
      {
        card_number: 'XS002345678',
        customer_name: 'Sarah van der Merwe',
        phone_number: '+27822345678',
        email: 'sarah.vdm@example.com',
        points_balance: 450,
        tier: 'silver',
        total_trolley_returns: 25,
        consecutive_returns: 5,
        is_active: true
      },
      {
        card_number: 'XS003456789',
        customer_name: 'Lerato Ndlovu',
        phone_number: '+27823456789',
        email: 'lerato.n@example.com',
        points_balance: 890,
        tier: 'gold',
        total_trolley_returns: 52,
        consecutive_returns: 10,
        is_active: true
      },
      {
        card_number: 'XS004567890',
        customer_name: 'John Smith',
        phone_number: '+27824567890',
        email: 'john.smith@example.com',
        points_balance: 1250,
        tier: 'diamond',
        total_trolley_returns: 105,
        consecutive_returns: 15,
        is_active: true
      },
      {
        card_number: 'XS005678901',
        customer_name: 'Zanele Dlamini',
        phone_number: '+27825678901',
        email: 'zanele.d@example.com',
        points_balance: 75,
        tier: 'bronze',
        total_trolley_returns: 5,
        consecutive_returns: 2,
        is_active: true
      },
      {
        card_number: 'XS006789012',
        customer_name: 'Pieter Botha',
        phone_number: '+27826789012',
        email: 'pieter.b@example.com',
        points_balance: 320,
        tier: 'silver',
        total_trolley_returns: 22,
        consecutive_returns: 0,
        is_active: true
      },
      {
        card_number: 'XS007890123',
        customer_name: 'Nomsa Khumalo',
        phone_number: '+27827890123',
        email: 'nomsa.k@example.com',
        points_balance: 15,
        tier: 'bronze',
        total_trolley_returns: 2,
        consecutive_returns: 1,
        is_active: true
      },
      {
        card_number: 'XS008901234',
        customer_name: 'David Johnson',
        phone_number: '+27828901234',
        email: 'david.j@example.com',
        points_balance: 0,
        tier: 'bronze',
        total_trolley_returns: 0,
        consecutive_returns: 0,
        is_active: false,
        blocked_reason: '3 unreturned trolleys. Return all trolleys to reactivate.'
      },
      {
        card_number: 'XS009012345',
        customer_name: 'Amina Patel',
        phone_number: '+27829012345',
        email: 'amina.p@example.com',
        points_balance: 680,
        tier: 'gold',
        total_trolley_returns: 48,
        consecutive_returns: 7,
        is_active: true
      },
      {
        card_number: 'XS010123456',
        customer_name: 'Michael Chen',
        phone_number: '+27820123456',
        email: 'michael.c@example.com',
        points_balance: 250,
        tier: 'silver',
        total_trolley_returns: 18,
        consecutive_returns: 4,
        is_active: true
      }
    ];

    // Check if cards already exist
    const existingCount = await XSCard.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing XS cards`);
      console.log('   Skipping seed (cards already exist)');
    } else {
      await XSCard.bulkCreate(demoCards);
      console.log(`✓ Created ${demoCards.length} demo XS cards`);
    }

    // Display summary
    console.log('\n📊 XS Card Summary:');
    const tierCounts = await XSCard.findAll({
      attributes: [
        'tier',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['tier'],
      raw: true
    });

    tierCounts.forEach(tc => {
      console.log(`   ${tc.tier.toUpperCase()}: ${tc.count} cards`);
    });

    console.log('\n✅ XS Card Integration setup complete!');
    console.log('\n📝 Sample test cards:');
    console.log('   Bronze:  XS001234567 (Thabo Mkhize)');
    console.log('   Silver:  XS002345678 (Sarah van der Merwe)');
    console.log('   Gold:    XS003456789 (Lerato Ndlovu)');
    console.log('   Diamond: XS004567890 (John Smith)');
    console.log('   Blocked: XS008901234 (David Johnson)');

    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000/kiosk');
    console.log('   3. Test checkout/return with sample cards above');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

setup();
