import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const doctorEmail = 'doctor@medilink.com'
  const password = 'doctorpassword'
  
  const existingDoctor = await prisma.user.findUnique({
    where: { email: doctorEmail }
  })

  if (existingDoctor) {
    console.log('Doctor account already exists!')
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const doctor = await prisma.user.create({
    data: {
      fullName: 'Dr. John Doe',
      email: doctorEmail,
      passwordHash: passwordHash,
      role: 'doctor',
      specialty: 'Cardiology'
    }
  })

  console.log('Doctor account created!')
  console.log('Email:', doctorEmail)
  console.log('Password:', password)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
