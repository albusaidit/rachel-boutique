import { CustomersTable } from "../../_components/CustomersTable";

const NAMES_AR = ["سارة", "نور", "ريم", "هدى", "فاطمة", "ميساء", "لينا", "دانة", "أسماء", "ريان", "غدير", "شذى"];
const NAMES_EN = ["Sara", "Nour", "Reem", "Huda", "Fatima", "Maysaa", "Lina", "Dana", "Asma", "Rayane", "Ghadeer", "Shatha"];
const SURNAMES = ["Al-Saud", "Al-Qahtani", "Al-Mutairi", "Al-Harbi", "Al-Otaibi", "Al-Dossary", "Al-Ghamdi", "Al-Shehri"];
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina"];

function rand(seed: number, max: number) {
  return Math.floor((Math.sin(seed * 9301 + 49297) + 1) * max) % max;
}

const customers = Array.from({ length: 12 }, (_, i) => {
  const seed = i + 1;
  const orders = rand(seed, 28) + 1;
  const avgOrder = 280 + rand(seed * 3, 1400);
  const spent = orders * avgOrder;
  const monthsAgo = rand(seed * 5, 36);
  const since = new Date();
  since.setMonth(since.getMonth() - monthsAgo);
  return {
    id: `cust-${(seed).toString().padStart(4, "0")}`,
    nameAr: `${NAMES_AR[i % NAMES_AR.length]} ${SURNAMES[rand(seed * 7, SURNAMES.length)]}`,
    nameEn: `${NAMES_EN[i % NAMES_EN.length]} ${SURNAMES[rand(seed * 7, SURNAMES.length)]}`,
    email: `${NAMES_EN[i % NAMES_EN.length].toLowerCase()}.${i}@example.com`,
    city: CITIES[rand(seed * 11, CITIES.length)],
    orders,
    spent,
    sinceISO: since.toISOString().slice(0, 10),
    isVip: spent > 8000,
    isNew: monthsAgo <= 2,
  };
});

export default function AdminCustomersPage() {
  return <CustomersTable customers={customers} />;
}
