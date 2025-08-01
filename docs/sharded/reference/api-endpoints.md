# API Endpoints Quick Reference

## Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `auth.me` | Query | Get current user with roles |
| `auth.updatePreferences` | Mutation | Update user preferences |
| `auth.completeOnboarding` | Mutation | Complete onboarding flow |
| `auth.logout` | Mutation | End user session |

## Session Planning
| Endpoint | Method | Description |
|----------|--------|-------------|
| `session.create` | Mutation | Create new session plan |
| `session.getById` | Query | Get single session plan |
| `session.getByTeam` | Query | List team session plans |
| `session.update` | Mutation | Update session plan |
| `session.delete` | Mutation | Delete session plan |
| `session.submitForApproval` | Mutation | Submit for approval |
| `session.approve` | Mutation | Approve session plan |
| `session.reject` | Mutation | Reject with feedback |
| `session.updateSharing` | Mutation | Share with players/parents |
| `session.duplicate` | Mutation | Copy existing plan |
| `session.quickPlan` | Mutation | Generate from template |

## AI Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `ai.generateSessionPlan` | Mutation | Generate AI session plan |
| `ai.chat` | Mutation | Chat with AI assistant |
| `ai.suggestDrills` | Query | Get drill recommendations |
| `ai.analyzeProgress` | Query | Get progress insights |

## Team Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `team.create` | Mutation | Create new team |
| `team.getById` | Query | Get team details |
| `team.getByClub` | Query | List club teams |
| `team.update` | Mutation | Update team info |
| `team.addMember` | Mutation | Add team member |
| `team.removeMember` | Mutation | Remove member |
| `team.getRoster` | Query | Get team roster |

## Player Development
| Endpoint | Method | Description |
|----------|--------|-------------|
| `player.getProfile` | Query | Get player profile |
| `player.updateProfile` | Mutation | Update profile |
| `player.getAssignments` | Query | Get homework |
| `player.completeHomework` | Mutation | Mark complete |
| `player.submitQuiz` | Mutation | Submit quiz answers |
| `player.getIDPs` | Query | Get development plans |
| `player.updateIDP` | Mutation | Update IDP progress |

## Curriculum Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `curriculum.get` | Query | Get club curriculum |
| `curriculum.update` | Mutation | Update curriculum |
| `curriculum.addDrill` | Mutation | Add new drill |
| `curriculum.updateDrill` | Mutation | Update drill |
| `curriculum.deleteDrill` | Mutation | Remove drill |
| `curriculum.importBulk` | Mutation | Bulk import |
| `curriculum.export` | Query | Export curriculum |

## Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `analytics.getDashboard` | Query | DOC dashboard data |
| `analytics.getTeamMetrics` | Query | Team analytics |
| `analytics.getPlayerProgress` | Query | Player metrics |
| `analytics.getCoachActivity` | Query | Coach engagement |
| `analytics.generateReport` | Mutation | Create PDF report |

## Communication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `notification.getUnread` | Query | Get unread notifications |
| `notification.markRead` | Mutation | Mark as read |
| `notification.updatePreferences` | Mutation | Update settings |
| `announcement.create` | Mutation | Post announcement |
| `announcement.update` | Mutation | Edit announcement |
| `announcement.delete` | Mutation | Remove announcement |
| `announcement.getByScope` | Query | Get announcements |

## Administration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `admin.inviteUser` | Mutation | Send invitation |
| `admin.updateUserRole` | Mutation | Change user role |
| `admin.deactivateUser` | Mutation | Deactivate account |
| `admin.getUsers` | Query | List club users |
| `admin.updateClubSettings` | Mutation | Update settings |
| `admin.createSeason` | Mutation | Create season |
| `admin.archiveSeason` | Mutation | Archive season |

## WebSocket Subscriptions
| Subscription | Description |
|--------------|-------------|
| `session.onUpdate` | Session plan updates |
| `notification.onNew` | New notifications |
| `team.onRosterChange` | Roster updates |
| `chat.onMessage` | Chat messages |

## Error Codes
| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Lacks permission |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource exists |
| `VALIDATION_ERROR` | Invalid input |
| `RATE_LIMITED` | Too many requests |
| `SERVICE_ERROR` | External service failed |

## Rate Limits
- Anonymous: 10 req/min
- Authenticated: 100 req/min
- AI operations: 10 req/min
- File uploads: 50 MB max