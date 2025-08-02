import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data
  await prisma.sessionDrill.deleteMany()
  await prisma.session.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.drill.deleteMany()
  await prisma.curriculum.deleteMany()
  await prisma.userClubRole.deleteMany()
  await prisma.user.deleteMany()
  await prisma.club.deleteMany()

  // Create clubs
  const club1 = await prisma.club.create({
    data: {
      name: 'Lightning FC',
      settings: {
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        timezone: 'America/Los_Angeles'
      },
      subscription: 'trial'
    }
  })

  console.log('✅ Created club:', club1.name)

  // Create users
  // Note: In production, users will be created through Supabase Auth
  // These are placeholder users for development
  
  const doc = await prisma.user.create({
    data: {
      id: 'user-doc-1',
      email: 'doc@lightning.fc',
      name: 'John Smith',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true
        }
      }
    }
  })

  const coach1 = await prisma.user.create({
    data: {
      id: 'user-coach-1',
      email: 'coach@lightning.fc',
      name: 'Sarah Johnson',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true
        }
      }
    }
  })

  const parent1 = await prisma.user.create({
    data: {
      id: 'user-parent-1',
      email: 'parent@example.com',
      name: 'Mike Williams',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: false
        }
      }
    }
  })

  console.log('✅ Created users')

  // Create user-club relationships
  await prisma.userClubRole.createMany({
    data: [
      {
        userId: doc.id,
        clubId: club1.id,
        role: 'doc',
        isPrimary: true,
        permissions: { all: true }
      },
      {
        userId: coach1.id,
        clubId: club1.id,
        role: 'head_coach',
        isPrimary: true,
        permissions: { 
          sessions: ['create', 'read', 'update', 'delete'],
          teams: ['read', 'update']
        }
      },
      {
        userId: parent1.id,
        clubId: club1.id,
        role: 'parent',
        isPrimary: true,
        permissions: {
          sessions: ['read'],
          players: ['read:own']
        }
      }
    ]
  })

  console.log('✅ Created user roles')

  // Create teams
  const team1 = await prisma.team.create({
    data: {
      clubId: club1.id,
      name: 'Lightning U12 Boys',
      ageGroup: 'U12',
      season: 'Fall 2024'
    }
  })

  const team2 = await prisma.team.create({
    data: {
      clubId: club1.id,
      name: 'Lightning U10 Girls',
      ageGroup: 'U10',
      season: 'Fall 2024'
    }
  })

  console.log('✅ Created teams')

  // Add coach to teams
  await prisma.teamMember.createMany({
    data: [
      {
        teamId: team1.id,
        userId: coach1.id,
        role: 'coach'
      },
      {
        teamId: team2.id,
        userId: coach1.id,
        role: 'coach'
      }
    ]
  })

  // Create curriculum
  const curriculum = await prisma.curriculum.create({
    data: {
      clubId: club1.id,
      name: 'Lightning FC Development Curriculum',
      description: 'Comprehensive youth development program',
      phases: {
        phases: [
          {
            name: 'Foundation Phase',
            ageGroups: ['U8', 'U10'],
            duration: '12 weeks',
            focus: ['Ball mastery', 'Basic coordination', 'Fun']
          },
          {
            name: 'Development Phase',
            ageGroups: ['U12', 'U14'],
            duration: '12 weeks',
            focus: ['Technical skills', 'Tactical awareness', 'Team play']
          }
        ]
      }
    }
  })

  console.log('✅ Created curriculum')

  // Create drills
  const drills = await Promise.all([
    prisma.drill.create({
      data: {
        clubId: club1.id,
        name: 'Dribbling Gates',
        description: 'Players dribble through gates to improve close control',
        category: 'technical',
        skillFocus: ['dribbling', 'ball_control'],
        ageGroups: ['U8', 'U10', 'U12'],
        duration: 10,
        playersMin: 6,
        playersMax: 20,
        setup: 'Set up 10-15 gates (2 cones, 1 yard apart) randomly in a 20x20 yard area',
        instructions: [
          'Players dribble through as many gates as possible in 1 minute',
          'Must go through gate with ball under control',
          'Cannot go through same gate twice in a row'
        ],
        coachingPoints: [
          'Keep ball close with small touches',
          'Head up to find next gate',
          'Use both feet',
          'Accelerate after going through gate'
        ],
        variations: [
          'Specific foot only',
          'Add defenders as gate keepers',
          'Make it a competition'
        ],
        difficulty: 2,
        equipment: ['cones', 'balls'],
        space: 'small',
        createdBy: doc.id,
        videoUrl: 'https://www.youtube.com/watch?v=example1',
        videoId: 'example1',
        thumbnail: 'https://img.youtube.com/vi/example1/hqdefault.jpg'
      }
    }),
    prisma.drill.create({
      data: {
        clubId: club1.id,
        name: 'Passing Squares',
        description: 'Passing exercise to improve accuracy and first touch',
        category: 'technical',
        skillFocus: ['passing', 'first_touch'],
        ageGroups: ['U10', 'U12', 'U14'],
        duration: 15,
        playersMin: 8,
        playersMax: 16,
        setup: 'Create 4 squares (5x5 yards) with 2-3 players in each square',
        instructions: [
          'Pass ball to player in different square',
          'Receive with first touch inside square',
          'Pass with second touch',
          'Rotate positions every 2 minutes'
        ],
        coachingPoints: [
          'Quality of pass (pace and accuracy)',
          'First touch in direction of next pass',
          'Communication before receiving',
          'Body shape when receiving'
        ],
        variations: [
          'One touch only',
          'Add defender in middle',
          'Specific passing patterns'
        ],
        difficulty: 3,
        equipment: ['cones', 'balls', 'bibs'],
        space: 'medium',
        createdBy: doc.id,
        videoUrl: 'https://www.youtube.com/watch?v=example2',
        videoId: 'example2',
        thumbnail: 'https://img.youtube.com/vi/example2/hqdefault.jpg'
      }
    }),
    prisma.drill.create({
      data: {
        clubId: club1.id,
        name: 'Dynamic Warm-up',
        description: 'Active warm-up with and without ball',
        category: 'warm_up',
        skillFocus: ['agility', 'coordination'],
        ageGroups: ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'],
        duration: 10,
        playersMin: 1,
        playersMax: 30,
        setup: 'Players spread out in designated area',
        instructions: [
          'Jogging with arm circles',
          'High knees, butt kicks',
          'Side shuffles',
          'Ball juggling while moving',
          'Dynamic stretches'
        ],
        coachingPoints: [
          'Gradual increase in intensity',
          'Proper form for movements',
          'Include ball work',
          'Stay on toes'
        ],
        variations: [
          'Add commands for direction changes',
          'Partner exercises',
          'Competition elements'
        ],
        difficulty: 1,
        equipment: ['balls'],
        space: 'medium',
        createdBy: doc.id
      }
    })
  ])

  console.log('✅ Created drills')

  // Create a sample session
  const session = await prisma.session.create({
    data: {
      teamId: team1.id,
      date: new Date('2024-08-10T16:00:00Z'),
      duration: 90,
      status: 'approved',
      theme: 'Ball Control and Passing',
      objectives: [
        'Improve first touch under pressure',
        'Develop passing accuracy',
        'Build confidence on the ball'
      ],
      plan: {
        warmUp: {
          duration: 15,
          activities: ['Dynamic Warm-up', 'Ball juggling']
        },
        main: {
          duration: 60,
          activities: ['Dribbling Gates', 'Passing Squares', 'Small-sided game']
        },
        coolDown: {
          duration: 15,
          activities: ['Light jogging', 'Static stretching', 'Team talk']
        }
      },
      createdBy: coach1.id,
      approvedBy: doc.id,
      approvedAt: new Date()
    }
  })

  // Link drills to session
  await prisma.sessionDrill.createMany({
    data: [
      {
        sessionId: session.id,
        drillId: drills[2].id, // Dynamic Warm-up
        order: 1,
        duration: 10
      },
      {
        sessionId: session.id,
        drillId: drills[0].id, // Dribbling Gates
        order: 2,
        duration: 15
      },
      {
        sessionId: session.id,
        drillId: drills[1].id, // Passing Squares
        order: 3,
        duration: 20
      }
    ]
  })

  console.log('✅ Created sample session')
  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📧 Test accounts created (for development only):')
  console.log('  - DOC: doc@lightning.fc')
  console.log('  - Coach: coach@lightning.fc')
  console.log('  - Parent: parent@example.com')
  console.log('\nNote: These are placeholder users. In production, users will be created through Supabase Auth.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })