// Menu transcribed from the supplied Packages&menu sheets. Package tiers are separate.
export const categories = {
 passed:'Butler-passed', appetizers:'Appetizers', savory:'Live stations', brunch:'Brunch live stations',
 buffet:'Pakistani mains', continental:'Continental entrées', kids:'Kids’ buffet', displays:'Event displays',
 drinks:'Mocktails', sweet:'Desserts',
};
export const menuGroups = [];
export const menu = [];
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// Rows: name | description | existing ID (when available) | surcharge note.
function group(id, category, title, source, rows, note='') {
 menuGroups.push({id,category,title,source,note});
 for(const row of rows.trim().split('\n')) {
  if(row.split('|').length>4) throw new Error(`Too many columns in menu row: ${row}`);
  const [name,description='',existingId='',surcharge=''] = row.split('|').map(value=>value.trim());
  menu.push({id:existingId||`${id}-${slug(name)}`,name,description,category,group:id,surcharge});
 }
}
group('pakistani-stations','savory','Pakistani traditional · Action stations','30cf2f6b-1b7f-4d68-bd5e-d14b3ea612c9.JPG',`
Bun Kebab (Chicken or Dal)|Toasted mini buns with your choice of chicken or dal, housemade sauce and fresh onions.|bun-kebab
Papri Chaat|Chickpeas, potatoes, onions, tomatoes, cilantro, house spice, tamarind sauce, green chutney, yogurt and housemade papri.|chaat
Gol Gappay|Choose two waters: traditional, lychee, pink guava, mango or jamun.|pani-puri
Guppa Gotala Chaat|Large puri filled with chickpeas and potatoes, topped with onions, tomatoes, cilantro, sev, masala and chutneys.
Patay Ki Chaat|Crispy fried kale and spinach with chickpeas, onions, tomatoes, cilantro, masala, chutneys and yogurt.
Paratha Rolls (Chicken, Paneer, Aloo)|Choice of filling in fresh paratha with garlic mayo, chutney and fresh onions.||Beef Behari: +$1.50 per guest.
Bhel Puri|Bhel mixed with masala, green chutney and tamarind chutney.
Samosa Chaat|Aloo samosa with warm chickpeas, onions, tomatoes, cilantro, yogurt, green chutney and tamarind chutney.
Dal Pakwan|Traditional Sindhi channa dal served on crispy pakwan, with onions, tomatoes, cilantro and chutneys.
Dahi Puri or Meethi Puri|Small gol gappay filled with yogurt, tamarind sauce, green chutney, chickpeas, tomatoes and onions, topped with masala.
Chatpata Chicken|Crispy battered chicken tossed in housemade chatpata sauce.
Punjabi Dahi Bhalla|Bhalla topped with sweet yogurt, housemade special masala, tamarind sauce and green sauce.
Live Dosa Station|Mini dosas cooked to order with traditional aloo filling and coconut chutney.
Bombay Vada Pav|Fried aloo vada in mini buttery buns with hot chili and garlic chutney.
`);
group('mediterranean','savory','Mediterranean live stations','1d081ffd-d274-4ced-b595-eb716e9a294b.JPG',`
Falafel Station (Vegetarian)|Hot crispy falafel in mini pita pockets with lettuce, tomatoes, cucumbers, tzatziki and hot sauce.
Chicken Gyro Shawarma|Freshly sliced chicken gyro in pita pockets with housemade gyro sauce, lettuce, cucumbers, pickles and onions.
`,'Appetizer portions are small and served accordingly.');
group('east-asia','savory','Flavors of East Asia','1d081ffd-d274-4ced-b595-eb716e9a294b.JPG',`
Pad Thai Live Station|Made-to-order chicken or vegetarian pad Thai noodles.
Phrick Chicken|Chicken tossed in Phrick sauce with peppers, onions and basil, served in a crispy noodle basket.
Thai Sweet Chilli Garlic Shrimp|Jumbo shrimp tossed in Thai-style sweet chilli garlic sauce.|thai-chili
Live Asian Station (Indo-Chinese)|Hakka-style chicken with lo mein noodles. Choose dragon chicken, chilli chicken, chicken in hot garlic sauce, sesame chicken, General Tso or orange chicken.
Burmese Khow Suey (Chicken)|Soft noodles in a rich coconut milk curry, served with crispy and zesty toppings.
Bao Bun Live Station|Steamed Korean bao buns filled with spicy crispy chicken.
`,'Appetizer portions are small and served accordingly.');
group('portuguese','savory','Portuguese station','1d081ffd-d274-4ced-b595-eb716e9a294b.JPG',`
Peri Peri Chicken|Live peri peri chicken served with yellow rice and white garlic sauce.
`);
group('mexican','savory','Mexican fusion live station','e0115f17-a19c-4ecd-9248-a3133992a8af.JPG',`
Chicken Fajita Tacos & Nacho Bar|Soft- or hard-shell tacos with tri-color nachos, chipotle sauce, corn salsa, pico de gallo, sour cream, nacho cheese, guacamole, picante salsa, refried beans, lettuce, fresh limes and salsa verde.||Beef or shrimp fajita: +$1.50 per guest.
`);
group('italian','savory','Italian live stations','e0115f17-a19c-4ecd-9248-a3133992a8af.JPG',`
Penne Pasta Live Station|Choose one sauce: Alfredo, marinara, creamy vodka, spicy mushroom or cacio e pepe. Cooked to order with grilled chicken, peppers, onions, basil, fresh Parmesan and herbs.||Live Parmesan wheel: +$1 per guest.
Flatbread Pizza Live Station|Made to order with grilled chicken, chicken tikka, halal pepperoni, onions, peppers, basil, olives, jalapeños or pineapple. Outdoor facility only; oven uses a propane tank.|pizza
Live Bruschetta Station|Toasted hero bread with house sauce, arugula, beef or chicken steak, chopped tomatoes, onions and cilantro.
Herb & Garlic Roasted Shrimp|Shrimp sautéed in butter, herb and garlic sauce.
`);
group('american','savory','American live stations','e0115f17-a19c-4ecd-9248-a3133992a8af.JPG',`
Beef Smash Burger|Mini beef smash burger with cheese and smash sauce.
Chicken Zinger Burger|Crispy fried chicken with cheese and zinger sauce.
Artisan Grilled Cheese & Soup Bar|Made-to-order grilled cheese sandwiches with hot tomato basil or seasonal soup shooters.
Mac and Cheese Station|White cheddar mac and cheese with turkey bacon, balsamic mushrooms, roasted onions and crispy herb breadcrumbs.
`);
group('premium','savory','Premium live station (main course)','Main course live station.JPG',`
Chicken Kata Kut|Boneless chicken kata kut cooked to order.||Additional $3 per guest.
Original Kata Kut|Gurday, kapuray and kaleji prepared to order.||Additional $5 per guest.
Chicken Mandi|Chicken carved to order with mandi rice and sauces.||Additional $4 per guest.
Sarsoon Ka Saag & Makki Ki Roti|Fresh makki roti with sarsoon ka saag and desi makhan.||Additional $4 per guest.
Lahori Tawa Chicken|Chicken leg quarters cooked on a tawa with gravy and green chilies, served on tawa roti.||Additional $4 per guest.
Balochi Mutton Sajji|Whole goat marinated with Balochi spices, slow cooked and served at a carving station.||$500 per goat.
Hunter’s Beef Carving Station|Spiced roasted beef carved in slices and topped with special Hunter’s beef sauce.||Additional $3.50 per guest.
Dal Tadka Live Station|Two types of dal with fresh tadka made to order, served with live tawa roti.||Additional $3 per guest.
Live Steak Station (Chicken & Beef)|Steaks cooked to order with selected sauce and sides.||Additional $5 per guest.
`,'Premium stations carry additional charges.');
group('butler-passed','passed','Butler-passed · Pakistani & fusion','841e6659-55d0-473f-a11e-e7cf9b4539e9.JPG',`
Jamun Shots|Refresher.
Dynamite Chicken in Lettuce Bed
Bhel Puri Bamboo Cones
Beef Steak on Tostada
Spicy Chicken in Edible Bowl
Malaysian Chicken Satay
Crab Rangoon
Chicken / Veg Dumplings|Served in a dim sum basket.
Chicken Parmesan Bites
Dynamite Shrimp in Lettuce Bed
Corn Fusion Chaat in Shot Glass
Crispy Fire Chicken
Mini Spring Rolls
Hot & Sour Soup Shot
Korean Chicken Bao Bun
Lamb Chops|||$5 per piece.
`);
group('mocktails','drinks','Mocktail selections','fc455bc0-5868-4cda-bff6-cd14b3fa0b92.JPG',`
Pink Guava Mojito
Lychee Lagoona
Mint Mojito
Jamun Mojito
Mango Margarita
Mango Lassi
Sweet Lassi
Salted Lassi
Piña Colada
Passion Fruit Cooler
Very Berry Mojito
Masala Limca
Tamarind Sharbat
`);
group('brunch','brunch','Brunch live stations','e937b802-731c-4745-a6eb-fe36d44dad4d.JPG',`
Crêpe Station|Made-to-order crêpes with your choice of sweet or savory fillings.|brunch-crepe-station
Avocado Toast on Sourdough
Omelette Station||omelette
Halwa Puri
`);
group('chicken','buffet','Chicken entrées','cd46f742-8e02-4649-b8d6-4b96de94c34c.JPG',`
Butter Chicken
Chicken Tikka Masala
Chicken Degi Qorma||qorma
Chicken Dhuan Ghost
Achari Chicken
Ginger Chicken Handi
Chicken Charsi Karahi
Balochi Tikka Karahi
Chicken Peshwari Karahi
Chicken Koyla Karahi
Chicken Shinwari Karahi
Chai Chenak Chicken Handi
Chicken Jalfrezi
Chicken Changezi Handi
Dum Ka Chicken (Hyderabadi)
Chicken Koyla Qeema
`);
group('rice','buffet','Rice entrées','cd46f742-8e02-4649-b8d6-4b96de94c34c.JPG',`
Punjabi Yukhani Pulao|Chicken, mutton or beef.
Degi Biryani|Chicken, mutton or beef.
Sindhi Biryani|Chicken, mutton or beef.|biryani
Kabuli Pulao|Chicken, mutton or beef.
White Biryani|Chicken, mutton or beef.
Hyderabadi Dum Biryani|Chicken or mutton.
White Zeera Rice
Saffron Pea Pulao
Channa Pulao (Degi)
`);
group('vegetable-paneer','buffet','Vegetable & paneer','cd46f742-8e02-4649-b8d6-4b96de94c34c.JPG',`
Chikkad Channa (Lahori Style)
Bhindi Masala
Kurkuri Bhindi
Aloo Gobhi
Khatay Aloo
Vegetable Jalfrezi
Bhey Ki Sabzi (Sindhi Style)
Bhagare Baigan (Hyderabadi)
Mirchi Ka Salan (Hyderabadi)
Sarsoon Ka Saag
Aloo Palak
Dal Makhani||dal
Tadka Dal
Dal Mash Fry
Paneer Makhani
Paneer Saag Wala
Paneer Karahi|Different options available.
Paneer White Handi
Achari Aloo
Chai Chenak Special Tawa Trio|Gobhi, crispy aloo and crispy bhindi.||Additional $2 per guest.
`);
group('breads','buffet','Tandoori breads','cd46f742-8e02-4649-b8d6-4b96de94c34c.JPG',`
Till Wala Naan
Sheermal
Roghni Kulcha
Garlic Naan
Plain Naan||naan
Tandoori Roti
Puri Paratha
Lacha Paratha
`);
group('mutton-beef','buffet','Mutton & beef','cd46f742-8e02-4649-b8d6-4b96de94c34c.JPG',`
Mutton Degi Qorma
Mutton Dahi Dhuan Ghost
Rajasthani Mutton Rogan
Mutton Peshwari Karahi
Mutton Shinwari Karahi
Mutton Charsi Karahi||karahi
Mutton Balochi Karahi
Mutton Namkeen Ghost
Mutton Badami Qorma
Beef Dum Ka Qeema
Beef Fry Kebab
Beef Koyla Qeema
Beef Degi Haleem
`);
group('charcoal-bbq','buffet','Charcoal BBQ','cd46f742-8e02-4649-b8d6-4b96de94c34c.JPG',`
Chicken Tikka Boti
Chicken Haryali Boti
Chicken Malai Boti
Chicken Balochi Boti
Chicken Behari Boti
Beef Behari Kebab
Chicken Seekh Kebab
Beef Seekh Kebab
Chicken Turkish Kebab
Chicken Steamed Roast
Peshwari Beef Chapli Kebab
Chicken Tikka with Bone
`);
group('live-desserts','sweet','Live dessert stations','7993ddc3-b6a5-4602-b427-e04d1a3b0f72.JPG',`
Falooda Station
Live Jalebi
Chocolate Fondue
Live Custard Station
Live Cannoli Bar
Crêpe Station||crepe
Gola Ganda
Ice Cream Bar with Toppings|Flavors: mango, lychee, rose, chickoo, chocolate, vanilla and strawberry.
`);
group('traditional-desserts','sweet','Traditional desserts · Non-live','7c6d58c4-05e9-46dd-a7ff-66bf06ed35c4.JPG',`
Qubani Ka Meetha
Lab-e-Shereen
Gulab Jamun
Shahi Kheer
Rasmalai
Gajjar Ka Halwa
Moong Dal Ka Halwa
Mango Delight
Trifle Fruit Custard||fruit-custard
Zafrani Shahi Tukra||shahi-tukra
`);
group('shooters','sweet','Dessert shooters','d858ff9b-cc67-41d7-84dc-9030ad02c544.JPG',`
Tiramisu
Tres Leches
Mango Mousse||mango-shooters
Coconut Pineapple Mousse
Dubai Chocolate Mousse
Strawberry Mousse
Chocolate Mousse
Pistachio Mousse
Passion Fruit & Mango Shooter
Biscoff Shooter
Apricot Delight
`,'Viennese dessert display: $25 per guest.');
group('vegetarian-appetizers','appetizers','Vegetarian appetizers · Non-live','364d08b3-f3fd-4ab2-86d7-d3ad15687f4b.JPG',`
Gol Gappay
Papri Chaat
Samosa Chaat
Dahi Bhalla
Dal Kachori with Khatay Alu Ki Sabzi
Aloo Tikki
Paneer Dilruba
Paneer Shashlik
Mix Bhajia Pakora
Gobhi Manchurian
Dynamite Cauliflower
Aloo Samosa
Vegetable Spring Rolls
`);
group('nonvegetarian-appetizers','appetizers','Nonvegetarian appetizers · Non-live','364d08b3-f3fd-4ab2-86d7-d3ad15687f4b.JPG',`
Dynamite Chicken
Spicy Majestic Chicken
Chicken Chatkhara Boti
Lahori Fried Fish
Chicken 65
Chicken Satay
Chicken Tiranga Kebab
Chicken Lollipop
Dynamite Shrimp
Chilli Chicken Dry
Chicken in Hot Garlic Sauce
Chicken Manchurian
`);
group('continental','continental','Continental entrée selections','c3e9f062-50d9-419a-b2cb-92a83cdff8a7.JPG',`
Chicken Parmesan
Eggplant Parmesan
Chicken Steak in Tarragon Sauce
Spicy Chicken in Mushroom Sauce
Roasted Herb & Garlic Potatoes
Italian Herb & Garlic Mashed Potatoes
Chicken Piccata
Roasted Vegetables
Herb & Garlic Rice
`);
group('kids','kids','Kids’ buffet menu','4cacab90-3406-4653-81e1-ae9acba60102.JPG',`
Penne Pasta|With chicken in white sauce.
Chicken Nuggets & Fries
Plain Cheese Pizza
Chicken Tenders & Fries
Chicken Sliders
Mac and Cheese
`);
// Existing event displays remain available alongside the new dish-level menu.
// Keep their IDs so saved plans, homepage favorites, and existing films still work.
group('event-displays','displays','Event displays & finishing touches',null,`
The Grazing Table|An arrangement of fruit, cheese and savory bites, styled to welcome your guests.|grazing
The Drinks Station|Build a refreshment station with your favorite mocktails from the menu.|drinks
The Bakery Table|Croissants, assorted breads, baguettes and cookies for breakfast or brunch.|bakery
The Paan Experience|Our colorful truck-art booth brings a memorable finishing touch to the celebration.|paan
The Dessert Table|Build your sweet selection with live desserts, traditional favorites and dessert shooters.|desserts
The Dessert Grazing Table|A dessert display to share. Choose the combination with our catering team.|dessert-grazing
BBQ Selection|Explore our charcoal BBQ choices to create your celebration spread.|bbq
The Salad Selection|A colorful salad display to complement your mains.|salad
`);
const categoryOrder = ['passed','appetizers','savory','brunch','buffet','continental','kids','displays','drinks','sweet'];
const groupOrder = new Map(categoryOrder.map((category,index)=>[category,index]));
menuGroups.sort((a,b)=>groupOrder.get(a.category)-groupOrder.get(b.category));
const groupPositions = new Map(menuGroups.map((group,index)=>[group.id,index]));
menu.sort((a,b)=>groupPositions.get(a.group)-groupPositions.get(b.group));
const filmIds = new Set(['bun-kebab','chaat','pani-puri','crepe','grazing','drinks','pizza','thai-chili','bakery','omelette','shahi-tukra','fruit-custard','paan','desserts','mango-shooters','dessert-grazing','salad']);
for(const item of menu) {
 if(filmIds.has(item.id)) Object.assign(item,{image:`media/${item.id}.webp`,video:`media/${item.id}.mp4`});
 // Distinguish the same dish offered as a live station and a non-live appetizer.
 item.selectionName = menu.some(other=>other.id!==item.id&&other.name===item.name)
  ? `${item.name} (${categories[item.category]})` : item.name;
}
export const featuredStationIds = ['bun-kebab','chaat','desserts','drinks'];
