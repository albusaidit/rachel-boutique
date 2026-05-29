import { listCustomers } from "@/app/_lib/db/customers-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { requireFullAdmin } from "../../_lib/auth";
import { CustomersTable } from "../../_components/CustomersTable";

const MOCK_NAMES_AR = ["سارة", "نور", "ريم", "هدى", "فاطمة", "ميساء", "لينا", "دانة", "أسماء", "ريان", "غدير", "شذى"];
const MOCK_NAMES_EN = ["Sara", "Nour", "Reem", "Huda", "Fatima", "Maysaa", "Lina", "Dana", "Asma", "Rayane", "Ghadeer", "Shatha"];
const MOCK_SURNAMES = ["Al-Saud", "Al-Qahtani", "Al-Mutairi", "Al-Harbi", "Al-Otaibi", "Al-Dossary", "Al-Ghamdi", "Al-Shehri"];
const MOCK_CITIES = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina"];

function rand(seed: number, max: number) {
  return Math.floor((Math.sin(seed * 9301 + 49297) + 1) * max) % max;
}

function buildMockCustomers() {
  return Array.from({ length: 12 }, (_, i) => {
    const seed = i + 1;
    const orders = rand(seed, 28) + 1;
    const avgOrder = 280 + rand(seed * 3, 1400);
    const spent = orders * avgOrder;
    const monthsAgo = rand(seed * 5, 36);
    const since = new Date();
    since.setMonth(since.getMonth() - monthsAgo);
    return {
      id: `cust-${seed.toString().padStart(4, "0")}`,
      nameAr: `${MOCK_NAMES_AR[i % MOCK_NAMES_AR.length]} ${MOCK_SURNAMES[rand(seed * 7, MOCK_SURNAMES.length)]}`,
      nameEn: `${MOCK_NAMES_EN[i % MOCK_NAMES_EN.length]} ${MOCK_SURNAMES[rand(seed * 7, MOCK_SURNAMES.length)]}`,
      email: `${MOCK_NAMES_EN[i % MOCK_NAMES_EN.length].toLowerCase()}.${i}@example.com`,
      city: MOCK_CITIES[rand(seed * 11, MOCK_CITIES.length)],
      orders,
      spent,
      sinceISO: since.toISOString().slice(0, 10),
      isVip: spent > 8000,
      isNew: monthsAgo <= 2,
    };
  });
}

export default async function AdminCustomersPage() {
  await requireFullAdmin();
  const dbReady = isDbConfigured();
  const customers = dbReady ? await listCustomers() : buildMockCustomers();
  return <CustomersTable customers={customers} dbReady={dbReady} />;
}
