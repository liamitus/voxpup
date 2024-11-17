import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'https://www.govtrack.us/api/v2';

async function fetchRepresentatives() {
  try {
    // Fetch current members of Congress
    const params = {
      current: true,
      limit: 600, // Enough to cover all members
    };
    const response = await axios.get(`${BASE_URL}/role`, { params });
    const roles = response.data.objects;

    for (const role of roles) {
      const person = role.person;
      await prisma.representative.upsert({
        where: { govtrackId: person.id },
        update: {
          firstName: person.firstname,
          lastName: person.lastname,
          state: role.state,
          district: role.district ? role.district.toString() : null,
          party: role.party,
          chamber: role.role_type_label.toLowerCase(), // 'representative' or 'senator'
        },
        create: {
          govtrackId: person.id,
          firstName: person.firstname,
          lastName: person.lastname,
          state: role.state,
          district: role.district ? role.district.toString() : null,
          party: role.party,
          chamber: role.role_type_label.toLowerCase(),
        },
      });
    }
    console.log('Representatives fetched and stored successfully.');
  } catch (error) {
    console.error('Error fetching representatives:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fetchRepresentatives();