import { PrismaClient } from '@prisma/client'

let _prisma: PrismaClient | null = null

export function getDb(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      log: ['error'],
    })
  }
  return _prisma
}

// For backward compatibility — but this won't initialize until accessed
export const db = {
  get user() { return getDb().user },
  get reel() { return getDb().reel },
  get book() { return getDb().book },
  get like() { return getDb().like },
  get comment() { return getDb().comment },
  get follow() { return getDb().follow },
  get securityEvent() { return getDb().securityEvent },
  get blockedIp() { return getDb().blockedIp },
  get conversation() { return getDb().conversation },
  get conversationParticipant() { return getDb().conversationParticipant },
  get directMessage() { return getDb().directMessage },
  get savedReel() { return getDb().savedReel },
  get story() { return getDb().story },
  $disconnect: () => _prisma?.$disconnect(),
}
