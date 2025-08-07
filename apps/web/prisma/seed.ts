import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function main() {
  console.log('🌱 Starting seed...')

  // Create or update clubs
  const club1 = await prisma.club.upsert({
    where: { id: 'lightning-fc' },
    update: {},
    create: {
      id: 'lightning-fc',
      name: 'Lightning FC',
      primaryColor: '#FF6B6B',
      settings: {
        timezone: 'America/Los_Angeles',
        ageGroups: ['U8', 'U10', 'U12'],
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4'
      },
      subscription: 'trial'
    }
  })

  const club2 = await prisma.club.upsert({
    where: { id: 'thunder-united' },
    update: {},
    create: {
      id: 'thunder-united',
      name: 'Thunder United',
      primaryColor: '#4ECDC4',
      settings: {
        timezone: 'America/New_York',
        ageGroups: ['U10', 'U12', 'U14', 'U16'],
        primaryColor: '#4ECDC4',
        secondaryColor: '#45B7D1'
      },
      subscription: 'premium'
    }
  })

  // Create or update test club for E2E tests
  const testClub = await prisma.club.upsert({
    where: { id: 'test-club' },
    update: {},
    create: {
      id: 'test-club',
      name: 'Test Club',
      primaryColor: '#333333',
      settings: {
        timezone: 'America/Los_Angeles',
        ageGroups: ['U8', 'U10', 'U12', 'U14'],
        primaryColor: '#333333',
        secondaryColor: '#666666'
      },
      subscription: 'trial'
    }
  })

  console.log('✅ Created/updated clubs')

  // Create or update users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alex@lightningfc.com' },
      update: {},
      create: {
        email: 'alex@lightningfc.com',
        name: 'Alex Thompson',
        supabaseId: 'sup_alex123',
        onboardingCompleted: true,
        notificationSettings: {
          email: true,
          push: true,
          sessionReminders: true
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'sam@lightningfc.com' },
      update: {},
      create: {
        email: 'sam@lightningfc.com',
        name: 'Sam Wilson',
        supabaseId: 'sup_sam456',
        onboardingCompleted: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'jordan@thunderunited.com' },
      update: {},
      create: {
        email: 'jordan@thunderunited.com',
        name: 'Jordan Lee',
        supabaseId: 'sup_jordan789',
        onboardingCompleted: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'parent@example.com' },
      update: {},
      create: {
        email: 'parent@example.com',
        name: 'Sarah Johnson',
        supabaseId: 'sup_parent123',
        onboardingCompleted: false
      }
    })
  ])

  console.log('✅ Created/updated users')

  // Create or update user-club relationships
  await Promise.all([
    prisma.userClub.upsert({
      where: {
        userId_clubId: {
          userId: users[0].id,
          clubId: club1.id
        }
      },
      update: {},
      create: {
        userId: users[0].id,
        clubId: club1.id,
        role: 'head_coach'
      }
    }),
    prisma.userClub.upsert({
      where: {
        userId_clubId: {
          userId: users[1].id,
          clubId: club1.id
        }
      },
      update: {},
      create: {
        userId: users[1].id,
        clubId: club1.id,
        role: 'assistant_coach'
      }
    }),
    prisma.userClub.upsert({
      where: {
        userId_clubId: {
          userId: users[2].id,
          clubId: club2.id
        }
      },
      update: {},
      create: {
        userId: users[2].id,
        clubId: club2.id,
        role: 'admin'
      }
    }),
    prisma.userClub.upsert({
      where: {
        userId_clubId: {
          userId: users[3].id,
          clubId: club1.id
        }
      },
      update: {},
      create: {
        userId: users[3].id,
        clubId: club1.id,
        role: 'parent'
      }
    }),
    // Give alex access to test club for E2E tests
    prisma.userClub.upsert({
      where: {
        userId_clubId: {
          userId: users[0].id, // alex@lightningfc.com
          clubId: testClub.id
        }
      },
      update: {},
      create: {
        userId: users[0].id, // alex@lightningfc.com
        clubId: testClub.id,
        role: 'head_coach'
      }
    })
  ])

  console.log('✅ Created/updated user-club relationships')

  // Create or update teams
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { 
        id: 'lightning-u10-boys' 
      },
      update: {},
      create: {
        id: 'lightning-u10-boys',
        clubId: club1.id,
        name: 'Lightning U10 Boys',
        ageGroup: 'U10',
        skillLevel: 'intermediate',
        season: '2025-Spring'
      }
    }),
    prisma.team.upsert({
      where: { 
        id: 'lightning-u12-girls'
      },
      update: {},
      create: {
        id: 'lightning-u12-girls',
        clubId: club1.id,
        name: 'Lightning U12 Girls',
        ageGroup: 'U12',
        skillLevel: 'advanced',
        season: '2025-Spring'
      }
    }),
    prisma.team.upsert({
      where: { 
        id: 'thunder-u14-elite'
      },
      update: {},
      create: {
        id: 'thunder-u14-elite',
        clubId: club2.id,
        name: 'Thunder U14 Elite',
        ageGroup: 'U14',
        skillLevel: 'advanced',
        season: '2025-Spring'
      }
    }),
    // Test team for E2E tests
    prisma.team.upsert({
      where: { 
        id: 'test-team'
      },
      update: {},
      create: {
        id: 'test-team',
        clubId: testClub.id,
        name: 'Test Team',
        ageGroup: 'U12',
        skillLevel: 'intermediate',
        season: '2025-Spring'
      }
    })
  ])

  console.log('✅ Created/updated teams')

  // Create or update players
  const players = await Promise.all([
    prisma.player.upsert({
      where: { id: 'player-michael-chen' },
      update: {},
      create: {
        id: 'player-michael-chen',
        teamId: teams[0].id,
        name: 'Michael Chen',
        dateOfBirth: new Date('2015-03-15'),
        position: 'Midfielder',
        jerseyNumber: '8'
      }
    }),
    prisma.player.upsert({
      where: { id: 'player-lucas-rodriguez' },
      update: {},
      create: {
        id: 'player-lucas-rodriguez',
        teamId: teams[0].id,
        name: 'Lucas Rodriguez',
        dateOfBirth: new Date('2015-06-22'),
        position: 'Forward',
        jerseyNumber: '9',
        userId: users[3].id // Parent user
      }
    }),
    prisma.player.upsert({
      where: { id: 'player-emma-wilson' },
      update: {},
      create: {
        id: 'player-emma-wilson',
        teamId: teams[1].id,
        name: 'Emma Wilson',
        dateOfBirth: new Date('2013-09-10'),
        position: 'Defender',
        jerseyNumber: '4'
      }
    })
  ])

  console.log('✅ Created/updated players')

  // Create or update drills
  const drills = await Promise.all([
    prisma.drill.upsert({
      where: { id: 'drill-triangle-passing' },
      update: {},
      create: {
        id: 'drill-triangle-passing',
        clubId: club1.id,
        name: 'Triangle Passing',
        category: 'technical',
        difficulty: 'beginner',
        minPlayers: 3,
        maxPlayers: 12,
        duration: 15,
        equipment: ['cones', 'balls'],
        description: 'Players form triangles and practice quick, accurate passing',
        objectives: ['Improve passing accuracy', 'Develop spatial awareness', 'Enhance communication'],
        setup: {
          field: '20x20 yards',
          groups: '3 players per triangle',
          equipment: '1 ball per group, 3 cones'
        },
        instructions: {
          steps: [
            'Set up triangles with cones 10 yards apart',
            'Players pass clockwise for 2 minutes',
            'Switch to counter-clockwise',
            'Progress to one-touch passing'
          ]
        },
        variations: [
          { name: 'Two-Touch', description: 'Limit players to two touches' },
          { name: 'Movement', description: 'Players follow their pass' }
        ],
        coachingPoints: [
          'Keep body open to the field',
          'First touch away from pressure',
          'Communicate before receiving'
        ],
        tags: ['passing', 'warm-up', 'technical'],
        isPublic: true
      }
    }),
    prisma.drill.upsert({
      where: { id: 'drill-4v4-possession' },
      update: {},
      create: {
        id: 'drill-4v4-possession',
        name: '4v4 Possession',
        category: 'tactical',
        difficulty: 'intermediate',
        minPlayers: 8,
        maxPlayers: 16,
        duration: 20,
        equipment: ['cones', 'balls', 'bibs'],
        description: 'Small-sided game focusing on maintaining possession',
        objectives: ['Improve decision making', 'Develop pressing', 'Enhance support play'],
        setup: {
          field: '30x30 yards',
          groups: '4v4 with 2 neutrals',
          equipment: '1 ball, different colored bibs'
        },
        instructions: {
          steps: [
            'Team in possession tries to complete 10 passes',
            'Defending team tries to win ball and counter',
            'Neutral players always play with team in possession',
            'Switch neutrals every 5 minutes'
          ]
        },
        coachingPoints: [
          'Create passing angles',
          'Quick ball movement',
          'Compact defending'
        ],
        tags: ['possession', 'tactical', 'small-sided'],
        isPublic: true
      }
    })
  ])

  console.log('✅ Created/updated drills')

  // Create or update sessions
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sessions = await Promise.all([
    prisma.session.upsert({
      where: { id: 'session-technical-skills' },
      update: {},
      create: {
        id: 'session-technical-skills',
        clubId: club1.id,
        teamId: teams[0].id,
        createdByUserId: users[0].id,
        title: 'Technical Skills Training',
        date: tomorrow,
        duration: 90,
        type: 'training',
        status: 'planned',
        location: 'Field A',
        plan: {
          warmUp: {
            duration: 15,
            drills: ['Dynamic stretching', 'Triangle Passing']
          },
          main: {
            duration: 60,
            drills: ['4v4 Possession', 'Shooting practice']
          },
          coolDown: {
            duration: 15,
            drills: ['Static stretching', 'Team talk']
          }
        },
        aiGenerated: true
      }
    })
  ])

  console.log('✅ Created/updated sessions')

  // Create or update session template
  await prisma.sessionTemplate.upsert({
    where: { id: 'template-u10-technical' },
    update: {},
    create: {
      id: 'template-u10-technical',
      clubId: club1.id,
      name: 'U10 Technical Development',
      description: 'Standard template for U10 technical skill development',
      ageGroups: ['U10'],
      duration: 75,
      objectives: ['Improve first touch', 'Develop passing accuracy', 'Build confidence on the ball'],
      structure: {
        warmUp: { duration: 15, focus: 'Ball familiarity' },
        technical: { duration: 20, focus: 'Passing and receiving' },
        smallSided: { duration: 25, focus: 'Game-like situations' },
        coolDown: { duration: 15, focus: 'Recovery and review' }
      },
      tags: ['technical', 'u10', 'development']
    }
  })

  console.log('✅ Created/updated session template')

  // Create or update curriculum
  await prisma.curriculum.upsert({
    where: { id: 'curriculum-us-soccer-u10' },
    update: {},
    create: {
      id: 'curriculum-us-soccer-u10',
      name: 'US Soccer Grassroots U10',
      federation: 'US Soccer',
      ageGroup: 'U10',
      description: 'Official US Soccer curriculum for U10 player development',
      structure: {
        phases: [
          {
            name: 'Phase 1: September-November',
            focus: 'Ball mastery and 1v1',
            topics: ['Dribbling', 'Running with the ball', '1v1 attacking', '1v1 defending']
          },
          {
            name: 'Phase 2: December-February',
            focus: 'Passing and receiving',
            topics: ['Short passing', 'First touch', 'Playing forward', 'Support play']
          },
          {
            name: 'Phase 3: March-May',
            focus: 'Small group play',
            topics: ['2v1', '2v2', 'Combination play', 'Transition']
          }
        ]
      }
    }
  })

  console.log('✅ Created/updated curriculum')
  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })