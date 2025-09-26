import { supabase } from "../lib/supabase";

async function seed() {
  await supabase.from("menu_items").upsert([
    { id: "margh", name: "Margherita", price_cents: 1000, tags: ["veg"] },
    { id: "pep", name: "Pepperoni", price_cents: 1200, tags: [] }
  ]);

  await supabase.from("toppings").upsert([
    { id: "pep", name: "Pepperoni", price_cents: 150 },
    { id: "msh", name: "Mushrooms", price_cents: 150 },
    { id: "olv", name: "Olives", price_cents: 150 }
  ]);

  console.log("Seed complete");
}

seed();
