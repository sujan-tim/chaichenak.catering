export const categories = {savory:'Street food & savory',buffet:'Buffet & accompaniments',sweet:'Desserts & paan',brunch:'Breakfast & brunch',drinks:'Drinks'};
const film = (id, name, category, description, note) => ({id,name,category,description,note,image:`media/${id}.webp`,video:`media/${id}.mp4`});
export const menu = [
 film('bun-kebab','Bun Kebab','savory','Warm buns, a sizzling griddle, and the unmistakable energy of a Pakistani street-food favorite.','Fresh from the griddle'),
 film('chaat','Papri Chaat','savory','A colorful spread of crisp papri, chutneys, and toppings, ready to bring a little crunch to the celebration.','A little crunch. A lot of character.'),
 film('pani-puri','Pani Puri','savory','Crisp puri and a vibrant station of accompaniments. An invitation for your guests to gather, taste, and come back for more.','A street-food favorite'),
 film('crepe','Live Crêpes','sweet','Watch your crêpes come together at the station. A freshly prepared finish for an afternoon gathering or evening celebration.','A sweet moment, made to order'),
 film('grazing','The Grazing Table','savory','An abundant arrangement of fruit, cheese, and savory bites, styled to welcome your guests to the table.','Made for gathering around'),
 film('drinks','The Drinks Station','drinks','A colorful refreshment station for arrivals, garden parties, and everything in between. Ask us about the drinks for your occasion.','A refreshing welcome'),
 film('pizza','Live Pizza','savory','A lively pizza station with a selection of toppings and a fresh-from-the-oven feel. A crowd-pleasing addition to the menu.','A slice of the celebration'),
 film('thai-chili','Thai Chili Garlic','savory','A vibrant, savory addition to your station lineup, presented in small portions for guests to enjoy as they mingle.','Bold flavor, beautifully served'),
 film('bakery','The Bakery Table','brunch','Croissants, assorted breads, baguettes, and cookies arranged for an easygoing breakfast or brunch gathering.','For slow mornings & good company'),
 film('omelette','Live Omelettes','brunch','A breakfast station with a colorful selection of accompaniments. A welcoming way to start your event.','Breakfast, with a personal touch'),
 film('shahi-tukra','Shahi Tukra','sweet','A traditional sweet finish, presented as part of a generous dessert display for your celebration.','A taste of tradition'),
 film('fruit-custard','Trifle & Fruit Custard','sweet','A colorful fruit-custard display that brings a fresh, nostalgic finish to the dessert table.','A family-table favorite'),
 film('paan','The Paan Experience','sweet','Our colorful truck-art booth brings its own sense of occasion. A memorable way to round off the celebration.','The signature finishing touch'),
 film('desserts','The Dessert Table','sweet','A generous display of individual desserts and sweet treats, styled for a memorable finish to your event.','Save room for something sweet'),
 film('mango-shooters','Mango Shooters','sweet','Mango desserts served in individual glasses, ready for guests to enjoy as part of your sweet selection.','A little glass of sunshine'),
 film('dessert-grazing','The Dessert Grazing Table','sweet','A beautifully arranged grazing display for your dessert course. Choose the combination with our catering team.','A sweet spread to share'),
 film('buffet','The Celebration Buffet','buffet','A generous buffet for weddings, family gatherings, and corporate celebrations. Build your spread with the dishes below.','The whole table, thoughtfully planned'),
 film('bbq','BBQ Selection','buffet','A selection of barbecue dishes for your celebration buffet. Ask our team about the cuts and preparations available for your occasion.','From the grill to your gathering'),
 film('biryani','Chicken Sindhi Biryani','buffet','Chicken Sindhi biryani, served as part of a generous Pakistani celebration spread.','A centerpiece for the table'),
 film('qorma','Chicken Degi Qorma','buffet','A traditional chicken qorma for your buffet, ready to pair with your choice of rice and breads.','Comfort, served generously'),
 film('karahi','Mutton Charsi Karahi','buffet','Mutton Charsi karahi brings another traditional favorite to your celebration menu.','For a memorable main course'),
 film('dal','Dal Makhani','buffet','Dal makhani to round out your buffet selection. Discuss ingredients and dietary requirements with our team.','A comforting addition'),
 film('naan','Naan','buffet','Naan for sharing alongside the qorma, karahi, and other dishes on your buffet.','Made for the middle of the table'),
 film('salad','The Salad Selection','buffet','A colorful salad display to complement your mains and bring variety to the buffet.','Fresh color for your spread'),
];
export const featuredStationIds = ['bun-kebab','chaat','buffet','desserts','drinks'];
