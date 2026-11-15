// Datos de demostración: un restaurante y un salón de belleza, con sus
// usuarios. Se puede ejecutar varias veces: borra y vuelve a crear los demos.
//
//   pnpm db:seed
//
// Usa la clave secreta de Supabase (salta la seguridad por filas), por eso
// solo debe correrse desde la terminal, nunca desde la aplicación.
import { createRequire } from "node:module";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en apps/web/.env.local");
  process.exit(1);
}
if (!/127\.0\.0\.1|localhost/.test(url) && process.env.SEED_ALLOW_REMOTE !== "1") {
  console.error("Esta base no es local. Para sembrar demos ahí, use SEED_ALLOW_REMOTE=1.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const PASSWORD = "demo-recepcion";
const colones = (n) => n * 100;

function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function ensureUser(email, fullName) {
  const list = must(await db.auth.admin.listUsers({ perPage: 1000 }), "listar usuarios");
  const existing = list.users.find((u) => u.email === email);
  if (existing) must(await db.auth.admin.deleteUser(existing.id), `borrar ${email}`);
  const created = must(
    await db.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
    `crear ${email}`,
  );
  return created.user.id;
}

async function seedBusiness(def) {
  must(await db.from("businesses").delete().eq("slug", def.business.slug), "limpiar negocio");
  const business = must(
    await db.from("businesses").insert(def.business).select().single(),
    `negocio ${def.business.slug}`,
  );
  const business_id = business.id;

  for (const member of def.team) {
    const user_id = await ensureUser(member.email, member.name);
    must(await db.from("memberships").insert({ business_id, user_id, role: member.role }), "membresía");
  }

  must(await db.from("agent_settings").insert({ business_id, ...def.agent }), "agente");
  must(
    await db.from("business_hours").insert(
      def.hours.map(([opens, closes], weekday) => ({
        business_id,
        weekday,
        closed: opens === null,
        opens: opens ?? "08:00",
        closes: closes ?? "17:00",
      })),
    ),
    "horarios",
  );
  must(
    await db.from("faqs").insert(
      def.faqs.map(([question, answer], position) => ({ business_id, question, answer, position })),
    ),
    "preguntas",
  );

  const groupIds = {};
  for (const group of def.modifierGroups ?? []) {
    const row = must(
      await db
        .from("modifier_groups")
        .insert({ business_id, name: group.name, min_select: group.min, max_select: group.max })
        .select("id")
        .single(),
      "grupo de modificadores",
    );
    groupIds[group.name] = row.id;
    must(
      await db.from("modifiers").insert(
        group.options.map(([name, price], position) => ({
          business_id,
          group_id: row.id,
          name,
          price_cents: colones(price),
          position,
        })),
      ),
      "modificadores",
    );
  }

  for (const [categoryPosition, category] of def.catalog.entries()) {
    const cat = must(
      await db
        .from("categories")
        .insert({ business_id, name: category.name, position: categoryPosition })
        .select("id")
        .single(),
      "categoría",
    );
    for (const [position, item] of category.items.entries()) {
      const product = must(
        await db
          .from("products")
          .insert({
            business_id,
            category_id: cat.id,
            kind: item.minutes ? "service" : "product",
            name: item.name,
            description: item.description ?? "",
            price_cents: colones(item.price),
            duration_minutes: item.minutes ?? null,
            position,
          })
          .select("id")
          .single(),
        `producto ${item.name}`,
      );
      for (const groupName of item.groups ?? []) {
        must(
          await db
            .from("product_modifier_groups")
            .insert({ business_id, product_id: product.id, group_id: groupIds[groupName] }),
          "modificadores del producto",
        );
      }
    }
  }
  console.log(`✓ ${business.name}`);
}

const restaurante = {
  business: {
    slug: "soda-la-guaria",
    name: "Soda La Guaria",
    type: "restaurant",
    description: "Comida típica costarricense hecha en casa: casados, gallo pinto y frescos naturales.",
    phone: "2222 0101",
    whatsapp: "8888 0101",
    email: "hola@sodalaguaria.example",
    address: "150 metros al este del parque central, local esquinero color verde.",
    city: "Heredia",
    policies:
      "Aceptamos efectivo, SINPE Móvil y tarjeta.\nPedidos para recoger: listos en 20 a 30 minutos.\nEntrega a domicilio solo en el centro de Heredia, con un costo de ₡1 000.\nLos pedidos se pueden cancelar sin costo antes de que entren a cocina.",
  },
  team: [
    { email: "dueno.restaurante@demo.test", name: "Marta Solano", role: "owner" },
    { email: "empleado.restaurante@demo.test", name: "Luis Arce", role: "employee" },
  ],
  agent: {
    agent_name: "Sofía",
    tone: "amable",
    greeting: "¡Hola! Gracias por escribir a Soda La Guaria. ¿En qué le puedo ayudar?",
    extra_instructions: "Al tomar un pedido, preguntar siempre si es para recoger o para entrega.",
    escalation_phone: "8888 0101",
  },
  // Domingo a sábado. null = cerrado.
  hours: [
    ["07:00", "14:00"],
    ["06:00", "20:00"],
    ["06:00", "20:00"],
    ["06:00", "20:00"],
    ["06:00", "20:00"],
    ["06:00", "21:00"],
    ["07:00", "21:00"],
  ],
  faqs: [
    ["¿Tienen parqueo?", "Sí, hay parqueo gratuito para clientes al costado del local."],
    ["¿Hacen entregas?", "Sí, en el centro de Heredia, con un costo de ₡1 000."],
    ["¿Hasta qué hora sirven desayunos?", "Los desayunos se sirven hasta las 10:30 a. m."],
    ["¿Tienen opciones vegetarianas?", "Sí: casado vegetariano y gallo pinto con huevo o queso."],
  ],
  modifierGroups: [
    {
      name: "Acompañamiento del casado",
      min: 1,
      max: 1,
      options: [
        ["Ensalada verde", 0],
        ["Picadillo de papa", 0],
        ["Plátano maduro extra", 500],
      ],
    },
    {
      name: "Tamaño del fresco",
      min: 1,
      max: 1,
      options: [
        ["Regular", 0],
        ["Grande", 400],
      ],
    },
    {
      name: "Extras",
      min: 0,
      max: 3,
      options: [
        ["Huevo frito", 500],
        ["Natilla", 400],
        ["Aguacate", 700],
      ],
    },
  ],
  catalog: [
    {
      name: "Desayunos",
      items: [
        { name: "Gallo pinto con huevo", description: "Con tortilla, natilla y café o agua dulce.", price: 2800, groups: ["Extras"] },
        { name: "Gallo pinto con carne en salsa", description: "Con tortilla y café o agua dulce.", price: 3600, groups: ["Extras"] },
        { name: "Tortilla con queso", description: "Tortilla palmeada con queso tierno.", price: 1800 },
      ],
    },
    {
      name: "Casados",
      items: [
        { name: "Casado con pollo", description: "Arroz, frijoles, pollo en salsa y acompañamiento.", price: 3800, groups: ["Acompañamiento del casado", "Extras"] },
        { name: "Casado con bistec", description: "Arroz, frijoles, bistec encebollado y acompañamiento.", price: 4200, groups: ["Acompañamiento del casado", "Extras"] },
        { name: "Casado con pescado", description: "Arroz, frijoles, filete de pescado empanizado y acompañamiento.", price: 4500, groups: ["Acompañamiento del casado", "Extras"] },
        { name: "Casado vegetariano", description: "Arroz, frijoles, vegetales salteados, huevo y acompañamiento.", price: 3500, groups: ["Acompañamiento del casado", "Extras"] },
      ],
    },
    {
      name: "Platos fuertes",
      items: [
        { name: "Olla de carne", description: "Solo sábados y domingos.", price: 4800 },
        { name: "Arroz con pollo", description: "Con papas tostadas y ensalada.", price: 3900 },
        { name: "Chifrijo", description: "Arroz, frijoles, chicharrón, pico de gallo y tortillas tostadas.", price: 3700 },
      ],
    },
    {
      name: "Bebidas",
      items: [
        { name: "Fresco natural", description: "Cas, mora, piña o tamarindo.", price: 1200, groups: ["Tamaño del fresco"] },
        { name: "Café chorreado", price: 900 },
        { name: "Agua dulce", price: 900 },
        { name: "Gaseosa", price: 1100 },
      ],
    },
    {
      name: "Postres",
      items: [
        { name: "Tres leches", price: 1800 },
        { name: "Arroz con leche", price: 1500 },
      ],
    },
  ],
};

const salon = {
  business: {
    slug: "salon-brisa",
    name: "Salón Brisa",
    type: "salon",
    description: "Salón de belleza: cortes, color, peinados, uñas y tratamientos capilares.",
    phone: "2233 0202",
    whatsapp: "8777 0202",
    email: "citas@salonbrisa.example",
    address: "Plaza Los Almendros, segundo piso, local 12.",
    city: "Escazú",
    policies:
      "Atendemos con cita previa.\nSe puede cancelar o reprogramar sin costo hasta 4 horas antes de la cita.\nDespués de 15 minutos de atraso la cita puede reprogramarse.\nAceptamos efectivo, SINPE Móvil y tarjeta.",
  },
  team: [
    { email: "dueno.salon@demo.test", name: "Daniela Rojas", role: "owner" },
    { email: "empleado.salon@demo.test", name: "Karla Mora", role: "employee" },
  ],
  agent: {
    agent_name: "Valeria",
    tone: "amable",
    greeting: "¡Hola! Le saluda Valeria, de Salón Brisa. ¿Le ayudo a agendar una cita?",
    extra_instructions: "Para servicios de color, recordar que el precio final depende del largo del cabello y se confirma en el salón.",
    escalation_phone: "8777 0202",
  },
  hours: [
    [null, null],
    [null, null],
    ["09:00", "18:00"],
    ["09:00", "18:00"],
    ["09:00", "18:00"],
    ["09:00", "19:00"],
    ["08:00", "17:00"],
  ],
  faqs: [
    ["¿Atienden sin cita?", "Atendemos con cita previa. Si hay un espacio libre el mismo día, con gusto se le agenda."],
    ["¿Tienen parqueo?", "Sí, la plaza tiene parqueo gratuito para clientes."],
    ["¿Qué formas de pago aceptan?", "Efectivo, SINPE Móvil y tarjeta."],
    ["¿Atienden niños?", "Sí, hacemos corte para niños y niñas."],
  ],
  modifierGroups: [
    {
      name: "Largo del cabello",
      min: 1,
      max: 1,
      options: [
        ["Corto", 0],
        ["Medio", 3000],
        ["Largo", 6000],
      ],
    },
  ],
  catalog: [
    {
      name: "Cortes",
      items: [
        { name: "Corte de dama", description: "Incluye lavado y secado.", price: 9000, minutes: 45 },
        { name: "Corte de caballero", price: 6000, minutes: 30 },
        { name: "Corte para niños", price: 5000, minutes: 30 },
      ],
    },
    {
      name: "Color",
      items: [
        { name: "Tinte completo", description: "Precio base; varía según el largo.", price: 22000, minutes: 120, groups: ["Largo del cabello"] },
        { name: "Mechas o balayage", description: "Precio base; varía según el largo.", price: 35000, minutes: 180, groups: ["Largo del cabello"] },
        { name: "Retoque de raíz", price: 15000, minutes: 90 },
      ],
    },
    {
      name: "Peinado y tratamientos",
      items: [
        { name: "Blower", price: 7000, minutes: 40, groups: ["Largo del cabello"] },
        { name: "Peinado para evento", price: 18000, minutes: 75 },
        { name: "Tratamiento de hidratación", price: 12000, minutes: 45 },
      ],
    },
    {
      name: "Uñas",
      items: [
        { name: "Manicure tradicional", price: 6500, minutes: 45 },
        { name: "Manicure en gel", price: 11000, minutes: 60 },
        { name: "Pedicure", price: 9000, minutes: 60 },
      ],
    },
  ],
};

await seedBusiness(restaurante);
await seedBusiness(salon);
console.log(`\nUsuarios demo (contraseña: ${PASSWORD}):`);
for (const member of [...restaurante.team, ...salon.team]) console.log(`  ${member.email} (${member.role})`);
