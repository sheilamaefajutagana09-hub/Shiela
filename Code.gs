/**
 * 30-Day Email Sender — The Financially Savvy Realtor
 * Kapag may form submission: owner notification + agarang Day 1 email sa lead.
 * Pagkatapos: isang email bawat araw mula Day 2 hanggang Day 30 (30 emails total).
 *
 * SETUP:
 * 1. Gumawa/magbukas ng Google Sheet, Extensions > Apps Script, at ilagay ang code na ito.
 * 2. I-edit ang CONFIG values sa ibaba.
 * 3. Patakbuhin ang setupEmailSystem() nang isang beses at aprubahan ang permissions.
 * 4. Patakbuhin ang authorizeSheilaPhotoAccess() nang isang beses at aprubahan ang Drive permission.
 * 5. I-deploy bilang Web app (Execute as: Me; access: Anyone) at ilagay ang URL sa WEB_APP_URL.
 * 6. Ituro ang landing-page form sa Web App URL at magpadala ng POST form/JSON.
 * 7. Sa Gmail, i-configure at i-verify ang SENDER_EMAIL bilang Send mail as alias ng script owner.
 *
 * Inaasahang form fields: email, firstName/first_name, lastName/last_name, phone, consent.
 */

const CONFIG = {
  SHEET_NAME: 'Email Leads 30D',
  EVENTS_SHEET_NAME: 'Email Events 30D',
  OWNER_NAME: 'Sheila Mae Fajutagana',
  LOGO_URL: 'https://lh3.googleusercontent.com/d/1CJ1DAYKk0Bx9atBF38CwiLeVZZRc4OVX=w2000',
  SHEILA_PHOTO_FILE_ID: '16KIMnOnyxFZ4lYs0lF3yD_tTp-WqSvl-', // Drive image: sheila-photo (1).jpg
  FROM_NAME: 'Sheila Mae Fajutagana | The Financially Savvy Realtor',
  SENDER_EMAIL: 'sheilamaefajutagana09@gmail.com', // Kailangang Gmail Send mail as alias
  REPLY_TO: 'sheilamaefajutagana09@gmail.com',
  OWNER_NOTIFY_EMAIL: 'sheilamaefajutagana09@gmail.com',
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbz7wc20cP7R0kQq4Xwy_oQqSnavEviZvBA2IcPsgRYXDcRfA7FB1AM_WWN69dUFbA3DqQ/exec',
  CONSULTATION_URL: 'https://script.google.com/macros/s/AKfycbz7wc20cP7R0kQq4Xwy_oQqSnavEviZvBA2IcPsgRYXDcRfA7FB1AM_WWN69dUFbA3DqQ/exec',
  FACEBOOK_URL: 'https://www.facebook.com/profile.php?id=61577472729033',
  YOUTUBE_URL: '',
  PHONE: '0991 885 9370',
  TIMEZONE: Session.getScriptTimeZone() || 'Asia/Manila',
  DAILY_SEND_LIMIT: 80
};

const LEAD_HEADERS = [
  'Lead ID', 'Created At', 'First Name', 'Last Name', 'Email', 'Phone',
  'Consent', 'Status', 'Sequence Start', 'Next Send Date', 'Last Sent Date',
  'Last Email Step', 'Unsubscribed At', 'Last Error', 'Updated At'
];
const EVENT_HEADERS = ['Timestamp', 'Lead ID', 'Email', 'Day', 'Subject', 'Result', 'Details'];

const EMAIL_SEQUENCE = [
  {
    "cta": "Visit our Facebook Page",
    "day": 1,
    "paragraphs": [
      "Starting a property search can feel exciting and overwhelming at the same time, especially when every listing seems to come with new questions.",
      "You do not need to decide everything today; the first step is simply to understand what matters most to you.",
      "Try writing down the reason you are considering a home or property now, whether it is a place to live, a future family home, or a long-term asset.",
      "Your purpose can help you sort useful options from properties that are attractive but do not fit your plans.",
      "Next, note the people and routines your future space should support, such as your commute, work schedule, family needs, or time spent in Cavite and nearby areas.",
      "A short list of priorities—like access to transport, room to grow, or proximity to loved ones—can make browsing more focused.",
      "It also helps to set a comfortable budget range before falling in love with a particular listing.",
      "Think beyond the advertised price: property-related expenses may include reservation or processing charges, taxes, association dues, utilities, and moving costs.",
      "The exact costs and payment terms vary, so ask for a written breakdown and take time to understand what is included.",
      "If you are an OFW, seafarer, or busy business owner, consider how you will review documents, attend viewings, and coordinate decisions from your location and schedule.",
      "A trusted point person can help with logistics, while important details should still be confirmed directly with the appropriate parties.",
      "When comparing areas, look at everyday convenience as well as the property itself: travel routes, nearby services, and how the neighborhood feels at different times.",
      "For a first viewing, bring your priorities and a simple checklist so you can compare homes based on the same essentials.",
      "Notice practical details such as ventilation, water access, mobile signal, storage, and signs of maintenance needs.",
      "Take photos or notes if permitted, and give yourself a little time afterward to reflect instead of deciding in the moment.",
      "It is completely reasonable to ask questions, request clarification, or pause while you gather information.",
      "A thoughtful search is not about seeing the most properties; it is about learning enough to recognize a suitable fit.",
      "For now, choose one small action: write your purpose, list three must-haves, or prepare the questions you want answered first.",
      "As you move forward, keep your comfort and readiness at the center of each decision.",
      "You can explore at your own pace and build a clearer picture one practical step at a time."
    ],
    "subject": "A calmer first step toward finding your place",
    "title": "Welcome to your property search"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 2,
    "paragraphs": [
      "A popular property can be appealing, but popularity alone cannot tell you whether it belongs in your plan.",
      "Before comparing listings, take a moment to name what you want a property to do for you.",
      "Are you hoping for a home near work, a place for your family to grow, a future base in Cavite, or a first step toward building assets responsibly?",
      "Your answer gives you a steadier way to assess options than likes, buzz, or someone else’s timeline.",
      "Try writing one sentence that describes your main goal, such as, “I want a home that makes my weekday commute manageable.”",
      "Keep that sentence nearby when you browse so each listing is considered against the same purpose.",
      "Next, list two or three practical must-haves that support the goal, such as a realistic travel time, enough room for your household, or access to everyday essentials.",
      "Separate those from nice-to-haves, which may be welcome but should not outweigh what matters most to you.",
      "For young professionals, the right fit might mean a manageable commute and room in the budget for other priorities.",
      "For OFWs or seafarers, it may help to think through who will use the property, how often, and who can help with viewing and upkeep while you are away.",
      "For business owners, consider whether the location and property type suit your intended use without stretching your available resources.",
      "Whatever your situation, begin with a comfortable budget rather than the highest price a seller or listing suggests.",
      "Remember to account for more than the advertised price: ask about applicable fees, recurring dues, utilities, maintenance, and costs of moving or furnishing.",
      "Those details can change how comfortable a choice feels month to month, so gather them before getting attached to a listing.",
      "When a trending property catches your eye, pause and ask: Which part supports my goal, and which part is simply popular right now?",
      "If you cannot yet tell, that is a useful signal to gather more information—not a reason to rush or to rule it out.",
      "Compare a small number of options using the same checklist: purpose, location, total expected costs, condition, and what you still need to verify.",
      "During a viewing, notice how the space and surroundings work for your everyday routine, and write down questions to follow up on.",
      "A thoughtful choice does not need to impress everyone; it needs to make sense for your needs, resources, and plans.",
      "If you would like more practical property notes for Cavite and nearby areas, visit our Facebook Page."
    ],
    "subject": "Choose the Property That Fits Your Why",
    "title": "Your Goal Before the Listing Trend"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 3,
    "paragraphs": [
      "Before comparing listings, take a moment to clarify what you hope a property will do for you.",
      "Is it primarily a place to call home, a chance to explore rental ownership, or part of a longer-term plan?",
      "There is no universally right answer, and your purpose can change as your life and priorities evolve.",
      "If you are looking for a home, think about the routines you want it to support: your commute, family time, rest, or proximity to people who matter.",
      "For young professionals, a practical location and manageable monthly costs may matter more than extra space you rarely use.",
      "If you are an OFW or seafarer, consider who would live in or look after the property while you are away, and how often you expect to use it.",
      "If you are exploring rentals, start by learning what kinds of tenants and rental arrangements are common in the areas you are considering.",
      "A property’s possible rental use is only one part of the picture; vacancy periods, upkeep, and other ownership costs also deserve attention.",
      "Avoid relying on a promised return or a best-case estimate when you are still comparing options.",
      "For a long-term plan, ask what role the property might play alongside your other goals, and what flexibility you may need along the way.",
      "A longer horizon does not mean every property will suit every future need, so consider how the location and layout could work as circumstances change.",
      "Try writing one sentence that describes your main purpose, then list two features that would make a property a good fit.",
      "You can also note what would make you pause, such as a commute that feels too difficult or recurring costs that stretch your comfort zone.",
      "Next, set a comfortable budget range that accounts for more than the advertised price, including fees, moving expenses, and ongoing upkeep.",
      "The costs and requirements can vary by property, so gathering clear information early can help you compare options more thoughtfully.",
      "For Cavite and nearby areas, compare the day-to-day feel of locations as well as travel routes, nearby services, and the places you regularly need to reach.",
      "When you view a property, picture your intended use in practical terms: where you would spend time, what might need attention, and whether the space fits your plans.",
      "If you are not ready to decide, that is useful to know too; you can use this stage to ask questions and understand what is available.",
      "Your next step can be simple: tell me which purpose feels closest right now, even if you are still weighing two possibilities.",
      "We can use that starting point to focus future conversations on properties and questions that match your priorities, without pressure to move faster than feels right."
    ],
    "subject": "What Do You Want This Property to Do for You?",
    "title": "Start with the purpose behind the property"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 4,
    "paragraphs": [
      "Online property browsing can be helpful, but a long stream of listings can quickly feel like too much.",
      "A few simple filters can turn scrolling into a more focused search that fits your goals and your time.",
      "Start by naming the purpose of your search: a home to live in, a place for family, or a property you are exploring as part of building assets.",
      "Your purpose helps you notice which details matter most, rather than treating every attractive photo as a possibility.",
      "Choose a comfortable price range before you browse, based on what you are prepared to explore—not just the highest figure a listing displays.",
      "Remember that the purchase price is not the only cost to understand; fees, taxes, association dues, and possible upkeep may also affect the overall picture.",
      "If you are still learning what fits, set a broad range and adjust it as you gather information, without feeling you need to decide immediately.",
      "Pick a few areas in Cavite or nearby that make sense for your daily routines, family connections, or other priorities.",
      "Compare locations by practical details such as travel routes, nearby services, and the time it may take to reach places you visit often.",
      "When browsing, use filters for property type, location, price, and basic features to narrow the results to a manageable number.",
      "Try changing one filter at a time so you can see what is limiting your options and which criteria matter most to you.",
      "Save only the listings that meet your main criteria, and keep a short note about why each one caught your attention.",
      "A simple comparison note might include the area, listed price, floor area, property type, and questions you would want to ask.",
      "Treat listing photos and descriptions as a starting point, not a substitute for checking details directly with the seller or representative.",
      "Look for information that is missing or unclear, such as the exact location, included features, fees, or whether the posted details are current.",
      "If a listing looks appealing, pause to compare it with your purpose, budget comfort, and preferred area before adding it to your saved options.",
      "Set a browsing time that works for you, especially if you are balancing work, business, or time zones while abroad or at sea.",
      "You can return to your notes later with a clearer head instead of feeling that you have to act on every listing you see.",
      "When you are ready, a focused shortlist can make it easier to ask useful questions and plan which properties may be worth viewing.",
      "Take the search one step at a time; thoughtful browsing is progress, even before you choose a property."
    ],
    "subject": "Make Your Property Search Easier to Navigate",
    "title": "A calmer way to browse online listings"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 5,
    "paragraphs": [
      "A comfortable property budget is not simply the largest amount a lender may approve. It is an amount that can fit alongside the life you already live.",
      "Start with your take-home income in a typical month, rather than your best month or an unusually busy season. If income varies, use a cautious estimate that feels realistic across quieter periods too.",
      "List the expenses that keep your household running: food, utilities, transport, school costs, support for family, and regular subscriptions or commitments. Seeing them together can make the space left for housing clearer.",
      "Include savings and emergency reserves as part of your monthly plan, not as whatever happens to remain at the end. A home goal should not require you to abandon every other important priority.",
      "Next, think beyond the monthly loan payment. Association dues, utilities, insurance, upkeep, and commuting can all affect what a home costs to live in month after month.",
      "For a property in Cavite or nearby areas, travel deserves a close look. Consider how often you need to reach work, school, family, or transport links, and what those journeys may add to your regular spending.",
      "A simple budget worksheet can help: note your monthly income, essential expenses, savings goals, and current debt payments. Then compare different possible housing costs to see how each would change your remaining room.",
      "Try a lower, middle, and higher monthly housing estimate instead of deciding from one appealing figure. Comparing scenarios makes trade-offs easier to notice before you commit to a property search.",
      "Leave a buffer for ordinary surprises, such as a repair, a medical expense, or an unexpected trip. The right size of that buffer depends on your circumstances, but it is worth making space for uncertainty.",
      "If your income comes from overseas work, seafaring, commissions, or a business, consider timing as well as totals. A month with delayed income can feel very different from a month when everything arrives as expected.",
      "You might also test your plan by setting aside a trial amount each month that is close to your estimated future housing costs. Notice whether it feels manageable while you continue paying current bills and saving.",
      "If the trial amount makes everyday life feel squeezed, that is useful information, not a reason to feel behind. You can adjust the target, timeline, location, or property type to find a more comfortable fit.",
      "A budget is also a way to clarify what matters most. Perhaps keeping room for family support, occasional travel, or a reliable commute matters more than stretching for extra space.",
      "When comparing homes, look at the full monthly picture rather than focusing only on the advertised price. Two properties at similar prices may come with different travel needs, upkeep, or shared costs.",
      "Write down the questions you want answered before viewing a property, including recurring fees and likely maintenance responsibilities. Clear information helps you compare options without relying on assumptions.",
      "You do not need to settle every number in one sitting. A first draft can simply show what you know, what you need to check, and which costs are still estimates.",
      "If you choose to speak with a lender or qualified professional, bring your questions and your own budget notes. Their information can help you understand options, while your household priorities remain central to the decision.",
      "Keep the plan flexible as your circumstances change. A new work arrangement, family responsibility, or shift in income may mean revisiting the numbers before moving forward.",
      "Thoughtful planning is not about finding the maximum you can spend; it is about finding a range that leaves you able to live, save, and make choices with less pressure.",
      "For more practical property-planning ideas for Cavite and nearby areas, visit our Facebook Page."
    ],
    "subject": "A Home Budget That Still Lets Life Happen",
    "title": "Make room for life in your property budget"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 6,
    "paragraphs": [
      "A property’s asking price is an important starting point, but it is not always the full cost of buying and owning it.",
      "Before you decide whether a home fits, ask for an estimate of the other costs involved in the transaction.",
      "Depending on the property and the transaction, these may include taxes, registration and transfer charges, documentation, and other processing fees.",
      "Ask which charges are fixed, which depend on the property’s price or assessed value, and which may vary with the process or provider.",
      "Clarify what is included in the seller’s or developer’s quoted price, and what you would need to pay separately.",
      "If you are buying through a bank or another lender, ask about possible appraisal, loan processing, insurance, and other financing-related charges.",
      "For a condominium, request details on association dues, move-in fees, parking charges, and any other recurring or one-time fees that apply.",
      "For a house and lot, check whether there are community dues, utility connection costs, or requirements for completing or improving the property.",
      "Ask when each payment is due, since a cost due before turnover can affect your cash needs differently from one paid later.",
      "It can help to separate one-time purchase expenses from the regular costs of keeping the property.",
      "Regular ownership costs may include utilities, maintenance, repairs, insurance, and community or association dues.",
      "If the home needs finishing work or repairs, ask what is already included and what condition the property will be in at turnover.",
      "When comparing homes in Cavite or nearby areas, compare the total picture—not just the headline price—using the same cost categories for each option.",
      "Request written estimates or official schedules where available, and confirm who can explain each charge and when the amount might change.",
      "A simple worksheet can list the item, estimated amount, payment timing, and whether the cost is one-time or recurring.",
      "Leave room in your planning for costs that are not yet confirmed, rather than treating an early estimate as a final bill.",
      "If a fee or document is unclear, ask the relevant professional or office to explain it before you make a commitment.",
      "The goal is not to expect every possible expense, but to understand the likely costs well enough to judge whether the property feels comfortable for you.",
      "Taking time to ask these questions is a practical part of preparing, whether you are buying for your own use or considering a longer-term asset.",
      "For more practical property-planning ideas, visit our Facebook Page."
    ],
    "subject": "What Does the Asking Price Leave Out?",
    "title": "Look Beyond the Asking Price"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 7,
    "paragraphs": [
      "A property decision is easier to think through when you look beyond the monthly payment and map how it fits into your household’s full cash flow.",
      "Start with the money that reliably comes in each month, using a conservative estimate if your income varies. For OFWs, seafarers, and business owners, it can help to distinguish regular income from bonuses, seasonal earnings, or amounts that are not always available.",
      "Next, list the obligations that already have a place in your budget: food, utilities, transport, education, existing loan payments, insurance, and support for family members. Include the recurring items that arrive less often, such as annual fees or school expenses.",
      "A simple monthly snapshot can make the pattern visible: income, essential household costs, current commitments, savings, and what remains. The purpose is not to judge the numbers, but to understand what they have to support.",
      "Be careful not to treat every peso left after bills as available for a home. Some of that room may need to cover emergencies, medical needs, repairs, or plans that matter to your family.",
      "If your income changes from month to month, consider what an ordinary or quieter month looks like. A plan that only feels manageable in your strongest earning month may not feel comfortable across the year.",
      "For income received in another currency or at irregular intervals, note when it actually arrives and when household expenses are due. Timing can matter as much as the monthly total.",
      "Then think through the costs of owning a property beyond the amount financed. Depending on the property and transaction, there may be association dues, utilities, insurance, maintenance, taxes, and one-time purchase or move-in costs to account for.",
      "Some costs are predictable, while others are occasional. Setting aside a monthly amount for repairs and upkeep can help make those less frequent expenses easier to anticipate.",
      "Household obligations can also change over time. A child starting school, a family member needing support, or a business requiring working capital may affect how much flexibility you want to preserve.",
      "Try sketching a few versions of your monthly picture: your current situation, a month with a higher expense, and a lower-income month if that is relevant. This is a practical way to spot pressure points before making a commitment.",
      "If you share expenses with a partner or family, talk through which obligations are fixed, which can shift, and what each person considers a comfortable amount to set aside. Clear expectations can make the decision feel more grounded.",
      "When comparing properties in Cavite and nearby areas, include location-related costs in the picture. Commute fares or fuel, tolls, parking, and travel time can shape the real monthly impact of a home’s location.",
      "A property that fits the numbers on paper may still feel too tight if it leaves little room for daily life. Comfort includes the ability to keep up with household needs and maintain some breathing space.",
      "You can use a range rather than a single target figure when discussing affordability. A lower, more comfortable range and a higher limit you would prefer not to cross can help guide your search without turning it into a promise or a rule.",
      "If a figure is uncertain, mark it as an estimate and check what it depends on. Ask the relevant provider, developer, or qualified professional for current details on costs and terms before relying on them.",
      "There is no need to settle every question today. Even a short list of monthly obligations and unknown costs is a useful first step toward a more informed property conversation.",
      "As you explore options, bring your cash-flow notes along with your priorities for location, space, and purpose. They can help keep property viewings focused on homes that make sense for your household as a whole.",
      "Thoughtful planning is not about finding the biggest commitment you can manage. It is about understanding the trade-offs and choosing a pace that respects your responsibilities and goals.",
      "When you’re ready, you can continue exploring practical property guidance and local updates on our Facebook Page."
    ],
    "subject": "A Clearer View of Monthly Cash Flow",
    "title": "Make Room for the Home—and the Rest of Life"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 8,
    "paragraphs": [
      "A thoughtful home purchase rarely happens on a perfect, predictable schedule.",
      "Work, family, travel, savings, and the right property all shape when buying makes sense for you.",
      "Instead of asking how quickly you can buy, start by asking what needs to be in place before you feel ready.",
      "Write down your main reason for considering a property, such as having a place of your own, planning for family needs, or building an asset over time.",
      "Your purpose can help guide the timeline, especially when listings or other people’s plans make you feel rushed.",
      "Next, look at the practical steps ahead: reviewing your budget, preparing documents, exploring areas, viewing properties, and understanding the full costs involved.",
      "These steps do not all need to happen at once, and the time each one takes can differ from person to person.",
      "For example, someone with a steady schedule in Cavite may arrange viewings more easily than an OFW or seafarer coordinating from another time zone.",
      "If your work involves travel or irregular hours, build in extra time for calls, document gathering, and visits when you are available.",
      "Give yourself room to compare options rather than treating the first property that fits your wish list as the only one worth considering.",
      "A realistic timeline also accounts for costs beyond the listed price, including fees, moving expenses, and any immediate setup needs.",
      "Taking time to understand these costs can help you decide whether the timing feels comfortable, without relying on guesswork.",
      "Consider choosing a few personal milestones, such as clarifying your budget range or narrowing down preferred areas, instead of setting a pressured purchase date.",
      "Milestones make progress visible while leaving space to adjust if your circumstances or priorities change.",
      "If a property catches your attention before you feel prepared, pause and identify what information you still need before making a decision.",
      "You can ask questions about the property, the buying process, and the next steps without committing to move forward.",
      "It may also help to discuss your plans with the people whose schedules or needs are part of the decision.",
      "A timeline that works for your household might be different from a friend’s, a colleague’s, or what you see online.",
      "There is no need to force a decision just to match someone else’s pace; informed progress is more useful than speed alone.",
      "When you are ready, we can explore Cavite and nearby options at a pace that gives you time to think through each step."
    ],
    "subject": "A Homebuying Timeline That Fits Your Life",
    "title": "Set a Realistic Purchase Timeline—Without Pressure"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 9,
    "paragraphs": [
      "A home can look right on paper and still feel inconvenient in everyday life. Today, let’s consider whether the neighborhood supports the way you actually live.",
      "Start with your regular destinations: work, school, family, places of worship, groceries, and the services you rely on. A location’s value to you often shows up in the time and effort it saves each week.",
      "Think through an ordinary weekday from morning to evening. Where would you go, how would you get there, and what might make the routine easier or harder?",
      "If you commute, check more than the map distance. Look into typical travel times at the hours you would leave and return, plus the routes or transport options you would realistically use.",
      "For shift workers, seafarers, and people with changing schedules, consider whether access still works outside conventional rush hours. Late-night transport, lighting, and the availability of everyday services may matter more than they first appear.",
      "If you work remotely or run a business from home, consider mobile signal, internet availability, delivery access, and whether the surroundings offer a comfortable place to focus. Confirm these details for the specific property rather than relying on general area claims.",
      "Visit the neighborhood at different times if you can. A quiet afternoon may feel quite different from a busy weekday morning or evening.",
      "Pay attention to the sounds around the property, nearby activity, street lighting, pedestrian movement, and how easy it is to enter or leave the area. Notice what feels comfortable to you, without assuming one person’s preference applies to everyone.",
      "Try a practical errand during your visit, such as finding a grocery store, pharmacy, or convenient transport stop. The actual walk or drive can tell you more than a list of nearby places.",
      "Check the walking routes, not just the straight-line distance. Sidewalks, crossings, shade, road conditions, and whether you feel at ease along the way can affect how useful a nearby destination really is.",
      "Consider who may share the home with you now or later. A household with children, older relatives, or frequent visitors may have different needs for schools, clinics, accessible routes, and places to gather.",
      "If you expect to travel often, compare access to main roads and transport links with the amount of traffic or noise they may bring. Convenience and quiet do not always come together in the same spot.",
      "Learn what services are available nearby and which ones require a longer trip. It can help to separate everyday essentials from occasional destinations so you can judge what matters most.",
      "Ask how seasonal weather affects the route and surroundings. In some locations, heavy rain or flooding can change travel times and access, so seek reliable local information and observe what you can during visits.",
      "Talk with residents or people who spend time in the area, if an opportunity arises. Ask open questions about daily routines, transport, noise, and services rather than relying on a single person’s opinion.",
      "Make a short location checklist before viewing: three must-haves, a few nice-to-haves, and any deal-breakers. This keeps your assessment grounded in your priorities instead of the excitement of a property tour.",
      "You can also rate each location on practical factors such as commute, essentials, comfort, and access. A simple comparison helps distinguish a genuinely suitable area from one that merely sounds appealing.",
      "Remember that nearby does not always mean convenient, and a longer distance may be manageable if the route fits your schedule. The right balance depends on your routines, household, and tolerance for travel.",
      "There is no need to decide everything today. A few thoughtful visits and well-chosen questions can help you understand whether a neighborhood feels workable for the life you want to build.",
      "For more grounded property tips and area considerations, visit our Facebook Page when it suits you. Take your time comparing locations, and let your everyday needs guide the next step."
    ],
    "subject": "A Neighborhood That Fits Your Everyday Life",
    "title": "Look Beyond the Property: Does the Location Work for You?"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 10,
    "paragraphs": [
      "A property search gets easier when you know which features are essential and which would simply make life more enjoyable.",
      "Try starting with the reason you want to buy: a home for your family, a place near work, or an asset you hope to hold responsibly over time. Your purpose helps set the priorities.",
      "Write down your must-haves before viewing properties. Keep the list short and focused on needs that would be difficult or costly to change later.",
      "Examples might include a location that works with your regular commute, enough bedrooms for your household, or a layout that supports your daily routine.",
      "Think about who will use the property now and how that could change in the next few years. A realistic view of your household plans can clarify which space requirements truly matter.",
      "Next, make a separate nice-to-have list. These are features you would appreciate but could live without, such as a balcony, a particular finish, or an extra room for occasional guests.",
      "It can help to mark each item as essential, preferred, or optional. This simple ranking makes it easier to compare homes without treating every preference as a deal-breaker.",
      "For every must-have, ask yourself why it matters. If the reason is mostly about appearance or a trend, consider whether it belongs on the nice-to-have list instead.",
      "Separate features that are hard to change from those that are easier to improve. A preferred paint color is usually more flexible than a location or a floor plan that does not suit your needs.",
      "Consider access to transport, schools, healthcare, shops, and family support based on your actual routines. In Cavite and nearby areas, travel time can vary, so check routes at the times you expect to use them.",
      "Give your budget a place in the exercise, too. A feature is not a practical must-have if getting it would push the whole purchase beyond the comfortable range you set.",
      "Remember that the purchase price is not the only cost to consider. Set aside room in your planning for possible fees, moving expenses, repairs, and ongoing upkeep.",
      "When comparing properties, score each one against your essentials first. Then note which preferences it satisfies, rather than allowing an attractive extra to distract from an important mismatch.",
      "If a property misses one item on your list, pause and ask whether the gap is manageable. Some compromises are reasonable; others may affect everyday comfort or create costs you are not prepared for.",
      "Bring your list to viewings and use it consistently. Photos and first impressions can be memorable, while written notes help you compare details afterward.",
      "You might also record questions that need follow-up, such as what is included, how the space is maintained, or whether a feature you value is available in the specific unit.",
      "If you are buying with a partner or family member, make your lists separately before discussing them. Comparing priorities can uncover shared essentials and preferences that one person can be flexible about.",
      "Revisit your list as you learn more, but change it deliberately. A new preference is worth considering; it does not automatically need to become a must-have.",
      "The goal is not to find a perfect property with every feature. It is to identify a home or property option that fits your purpose, practical needs, and comfortable budget.",
      "A thoughtful shortlist begins with clear priorities. When you are ready, visit our Facebook Page for more helpful property guidance and updates."
    ],
    "subject": "A clearer way to sort your property priorities",
    "title": "Must-Haves vs. Nice-to-Haves"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 11,
    "paragraphs": [
      "Listing photos are a helpful first look, but they are only one small part of understanding a property.",
      "A camera can make a room feel brighter or more spacious, and a carefully chosen angle may leave out what sits just beyond the frame.",
      "Photos rarely tell you how a home feels at different times of day, so notice where natural light falls during an actual visit.",
      "A sunny bedroom in a morning photo may receive less light later, while a shaded corner might feel cooler and more comfortable than the image suggests.",
      "Pay attention to what the pictures do not show, such as ceilings, corners, storage areas, and the view from each window.",
      "Those missing details are not automatic warning signs; they are useful questions to bring along when you view the property.",
      "A wide-angle lens can make a compact room appear generous, so check how your own furniture and daily routines might fit the real dimensions.",
      "If measurements are available, compare them with a familiar space or note the dimensions you would want to verify in person.",
      "Photos also cannot capture sounds from nearby roads, businesses, neighbors, or shared areas.",
      "During a viewing, pause and listen with the windows open and closed, if possible, and consider visiting at a different time if noise matters to you.",
      "Look for clues about ventilation and temperature, too, because a still image cannot show how air moves through the rooms.",
      "Ask how the windows open, where cross-breezes might come from, and whether the space feels comfortable during your visit.",
      "A tidy, staged image does not show how much storage is available for the things you actually use.",
      "Check closets, kitchen cabinets, utility spaces, and any storage included with the property rather than assuming the photograph tells the whole story.",
      "Photos may not make shared facilities, access routes, parking arrangements, or the surrounding street easy to understand.",
      "Walk through the common areas and nearby surroundings, and clarify which features are included and how they are maintained.",
      "Notice finishes and fixtures closely in person, since lighting and image quality can hide wear, uneven surfaces, or details you may want to ask about.",
      "Keep a simple note of what you observe, what you like, and what needs confirmation so different properties are easier to compare later.",
      "A thoughtful viewing is not about finding fault; it is about building a fuller picture before deciding whether a home fits your purpose and comfortable budget.",
      "For more practical property-viewing reminders, visit our Facebook Page and take your time learning what matters to you."
    ],
    "subject": "What Listing Photos Can’t Show You",
    "title": "Look Beyond the Listing Photos"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 12,
    "paragraphs": [
      "A viewing is more useful when you arrive with a plan. Save this checklist on your phone so you can compare homes based on what matters to your everyday life.",
      "Before you go, revisit your purpose: Is this a home for your family, a place near work, or a property you are exploring as a long-term asset? Your priorities will shape what to notice.",
      "Check the route at the time you would usually travel. Note your travel time, road conditions, public transport options, and access to the places you visit often.",
      "Walk around the neighborhood, not just the property. Look for nearby groceries, clinics, schools, transport stops, and other essentials that fit your routine.",
      "Notice the surroundings at different points during your visit. Traffic, noise, drainage, street lighting, and the general activity of the area can affect daily comfort.",
      "As you enter, check how the space feels to move through. Consider whether the layout supports your routines, furniture, privacy, and storage needs.",
      "Look closely at walls, ceilings, and floors. Stains, cracks, uneven areas, or fresh patches may be worth asking about and checking further.",
      "Open windows and observe airflow and natural light. A room can look different in photos, so see how bright and ventilated it feels in person.",
      "Test doors, windows, locks, faucets, switches, and outlets where permitted. Make a note of anything loose, damaged, or not working as expected.",
      "Check kitchens and bathrooms carefully for leaks, odors, water pressure, ventilation, and signs of moisture. Ask when fixtures or major systems were last maintained.",
      "If the property includes appliances or fixtures, clarify which items are included in the sale or lease. Record anything that should be confirmed in writing later.",
      "For a condo or subdivision, ask about shared spaces and day-to-day rules. Find out what facilities are available, how they are maintained, and whether there are restrictions relevant to you.",
      "Ask about practical recurring costs, such as association dues, utilities, parking, and maintenance. These belong in your comfort-budget comparison, not just the headline price.",
      "Look at parking, access roads, gates, elevators, and common areas if they apply. Consider how convenient they would be during busy or rainy days.",
      "Take photos or short notes with permission, labeling each one by room or feature. This makes it easier to remember details after visiting several properties.",
      "Bring a simple comparison sheet with your must-haves, nice-to-haves, and deal-breakers. Rate each property against the same criteria rather than relying on memory alone.",
      "Ask clear questions about the property's condition, included features, available documents, and next steps. If an answer is uncertain, note it for follow-up instead of assuming.",
      "You do not need to decide during the viewing. Give yourself time to review what you observed and discuss any unanswered questions with the appropriate professionals.",
      "Afterward, compare the property with your purpose, budget, location needs, and expected costs. A thoughtful choice is one that fits your life, not simply the one that looks impressive.",
      "A little preparation can make every viewing more grounded and less overwhelming. Visit our Facebook Page for more practical tips as you explore your options at your own pace."
    ],
    "subject": "A Practical Checklist for Your Next Property Viewing",
    "title": "Look Beyond the First Impression"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 13,
    "paragraphs": [
      "A viewing is more than a chance to picture your furniture in a new home. It is also your opportunity to ask clear questions and check whether the property fits your plans.",
      "Before you go, write down your main purpose: living in the home, keeping it for future use, or exploring a rental property. Your purpose helps you focus on the details that matter most.",
      "Ask what is included in the asking price, such as parking, appliances, fixtures, or storage. Confirm which items are actually part of the sale rather than simply shown for display.",
      "Request a clear breakdown of other costs you may need to prepare for, including association dues, utility connection charges, maintenance fees, and any applicable taxes or transfer-related expenses. Ask who can provide the current figures and what they cover.",
      "If the property is in a subdivision or condominium, ask about monthly dues, how often they are collected, and whether there are separate charges for amenities or parking. If possible, review the latest written schedule rather than relying on memory.",
      "Ask which utilities serve the unit or lot, and whether water, electricity, and internet connections are already active. Find out if there are known service interruptions or connection steps to plan for.",
      "Look closely at walls, ceilings, floors, windows, doors, and visible plumbing. Note stains, cracks, musty smells, sticking doors, or signs of recent patching, and ask about any repairs or maintenance history.",
      "Test taps, switches, outlets where safe, locks, and included appliances. A quick check can help you make a list of questions for the seller or property representative.",
      "Ask how the area handles heavy rain and where water tends to collect. In Cavite and nearby communities, it is worth checking drainage around the property and asking residents or local contacts about conditions during the wet season.",
      "Visit at a different time of day if you can. Traffic, noise, sunlight, parking, and nearby activity can feel quite different in the morning, evening, or on a weekend.",
      "Check your everyday routes, not just the distance on a map. Consider travel to work, schools, transport, shops, healthcare, and the roads you would use most often.",
      "Ask what future development is planned nearby and where you can verify that information. A sales conversation is a useful starting point, but plans and timelines can change.",
      "For a house and lot, clarify the lot boundaries, access road, and any shared spaces or easements. Ask to see the relevant plan or property documents and have qualified professionals explain anything you are unsure about.",
      "For a condominium, ask which areas are exclusive to your unit and which are shared. Confirm the rules for pets, renovations, rentals, parking, deliveries, and amenity use.",
      "Ask about the ownership or project documents available for review, and who is authorized to answer questions about them. Take notes on document names and follow up with an appropriate qualified professional before making a commitment.",
      "Find out whether the property is ready for occupancy or still under construction. If work remains, ask for the expected handover details, what will be completed, and how concerns are handled after turnover.",
      "Take photos or notes during the viewing, with permission. Label them by property and date so you can compare options accurately instead of relying on what you remember later.",
      "Afterward, list what you confirmed, what remains unanswered, and what you would need to spend time or money addressing. This gives you a practical basis for comparing the property with your budget and priorities.",
      "You do not need to decide during the viewing. It is reasonable to ask for information in writing, take time to review it, and bring a trusted person or professional into the conversation.",
      "A thoughtful set of questions can make each viewing more useful and help you move at a pace that feels right. Visit our Facebook Page for more practical property tips."
    ],
    "subject": "A smarter property viewing: what to ask and verify",
    "title": "Look beyond the finish"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 14,
    "paragraphs": [
      "When you visit more than one property, small details can blur together by the time you get home. A few organized notes can help you compare each option with a clearer head.",
      "Start with a simple page or phone note for every property. Give it a consistent title with the date, project or property name, and area.",
      "Before viewing, write down what matters most to you. It might be commute time, room to work from home, space for family, or a comfortable monthly budget.",
      "Keep your priorities visible at the top of each note. That makes it easier to notice whether a property fits your actual needs, rather than just its most impressive feature.",
      "Record the asking price and any payment details that were shared. Mark estimates as estimates, and note who provided the information so you can verify it later.",
      "Include costs beyond the headline price whenever they come up. Ask about items such as association dues, parking, utilities, move-in charges, or finishing work, and label anything still unknown.",
      "Write the exact location and nearby landmarks, not just the barangay or subdivision name. If you can, note how long it took to reach places you visit regularly.",
      "Capture the basics of the layout: bedrooms, bathrooms, storage, natural light, and any space you would use every day. A quick sketch can be more useful than relying on memory.",
      "Make two short lists: what works well and what gives you pause. Keep observations specific, such as ‘kitchen has limited counter space’ instead of simply ‘not ideal.’",
      "During the viewing, separate what you saw from what you were told. For example, note visible signs of wear separately from a representative’s explanation about repairs or inclusions.",
      "If a feature matters to you, take a photo only after asking permission. Add a caption right away so pictures from different properties do not become difficult to identify.",
      "Write down questions that need follow-up, even if they seem minor. A clear question list helps you get consistent answers from the right contact later.",
      "You can use the same headings for every option: budget, location, layout, condition, extra costs, strengths, concerns, and open questions. Consistent headings make side-by-side comparisons much easier.",
      "Try a simple rating scale for your top priorities, such as one to five. Treat the score as a memory aid, not a decision by itself.",
      "Leave space for a ‘how it felt’ note, but describe the reason behind the feeling. Perhaps the rooms felt cramped, the route was convenient, or the surroundings were quieter than expected.",
      "After each visit, take five minutes to finish your notes while the details are fresh. Clarify abbreviations and mark anything you want to check against documents or a second visit.",
      "When comparing homes, revisit your original purpose and comfortable budget. A property that looks appealing in one area may not be the best fit across your priorities and ongoing costs.",
      "If you are viewing with a partner or family member, each person can add observations before you compare. Different perspectives may surface useful questions without requiring an immediate choice.",
      "Keep the notes somewhere easy to find and use the same format each time. Your future self will appreciate having the details in one place when you are ready to review calmly.",
      "Thoughtful comparisons do not need to be complicated; they just need to reflect what matters to you. Take your time, ask clear questions, and make the next step when you feel prepared."
    ],
    "subject": "A Clearer Way to Compare the Homes You Visit",
    "title": "Keep Your Property Notes Useful"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 15,
    "paragraphs": [
      "A property consultation can be a simple, focused conversation—not a commitment to buy.",
      "The aim is to make space for your questions, clarify what matters to you, and identify sensible next steps for your situation.",
      "Before the conversation, take a moment to name your main reason for exploring property. It might be a future home, a place for family, or a careful first step toward building assets.",
      "Your purpose does not need to be perfectly decided. Even a few possibilities can help guide a useful discussion.",
      "It also helps to choose a comfortable budget range before looking at specific properties. Think about what feels manageable, rather than what someone else says you should spend.",
      "If your income varies because of business, overseas work, or time at sea, mention that context in broad terms. It can help keep the conversation realistic without requiring you to share anything you are uncomfortable sharing.",
      "Consider the costs beyond the advertised price, too. Ask what other expenses might come up during the buying process and after turnover.",
      "Depending on the property and transaction, items to ask about may include fees, taxes, documentation, utilities, repairs, and ongoing dues. The details vary, so treat the conversation as a chance to identify what to verify.",
      "You can bring a short list of questions on your phone or a piece of paper. A few clear questions are often more helpful than trying to remember everything in the moment.",
      "For example, you might ask which Cavite or nearby areas could fit your priorities, what trade-offs to compare, and what information to request before deciding whether to view a property.",
      "If location is still open, think about your daily routines and practical needs. Travel time, access to essentials, family considerations, and the feel of the neighborhood may all matter differently to you.",
      "If you are curious about a particular development or listing, bring its name or link. You can discuss what is known, what remains unclear, and which details deserve confirmation.",
      "A consultation can also help you prepare for property viewing. Ask what to observe on-site, what to ask the representative, and what notes or photos could help you compare options later.",
      "There is no need to arrive with every document or decision already made. You can ask what information would be useful and decide for yourself what you are comfortable sharing.",
      "It is perfectly reasonable to ask for explanations in plain language, take notes, or pause when you need time to think. Clear understanding matters more than keeping the conversation moving quickly.",
      "You can set the scope at the start: perhaps you want to discuss budget considerations, compare locations, or understand the steps involved before considering a viewing.",
      "And you can say what you are not ready to do. A conversation should respect your pace, whether you are gathering information, comparing possibilities, or simply beginning to explore.",
      "To make the most of the time, choose one or two outcomes you would find helpful. You might leave with a clearer question list, a few areas to research, or a better sense of what to verify next.",
      "Afterward, give yourself room to review your notes and consider the information without pressure. A thoughtful decision can take more than one conversation.",
      "When you are ready, visit our Facebook Page to connect with Sheila Mae Fajutagana, The Financially Savvy Realtor, and start with the questions that matter to you."
    ],
    "subject": "Make Your Property Consultation Work for You",
    "title": "A Clearer Conversation, at Your Pace"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 16,
    "paragraphs": [
      "Choosing a property type is less about finding the one everyone prefers and more about finding the one that supports your everyday life and longer-term plans.",
      "A house may suit you if you value privacy, room to grow, and control over your own space. Consider whether you are ready to manage upkeep, security, and the costs that come with a larger property footprint.",
      "For a house, look beyond the floor area: check the condition of the roof, plumbing, electrical systems, drainage, and boundaries. These details can shape both comfort and the maintenance budget after purchase.",
      "A condominium can work well if you want a more compact home, shared amenities, and a location close to work, services, or transport. It may be especially practical when you spend much of your time outside the home.",
      "With a condo, include monthly association dues and possible special assessments in your comparison. Ask what building services cover, how parking works, and which rules could affect pets, renovations, or rentals.",
      "A townhouse may offer a middle ground, with more private space than many condos and less exterior upkeep than a standalone house. It can be worth exploring if you want a multi-level layout without taking on a full lot’s maintenance.",
      "Before choosing a townhouse, think about stairs, shared walls, parking, and how the community handles repairs and common areas. Visit at different times if possible to get a feel for noise, access, and daily traffic.",
      "A lot can make sense if building a home gradually or tailoring a design matters more to you than moving in right away. It requires patience and careful preparation, since construction plans and costs come later.",
      "For a lot, verify access, utilities, drainage, road conditions, and the property’s boundaries before comparing it with move-in-ready options. Also consider the time and coordination needed to design and build a home that fits the site.",
      "In Cavite and nearby areas, the same property type can feel very different depending on its location. Commute routes, public transport, nearby essentials, and the rhythm of the neighborhood are part of the fit.",
      "Try mapping an ordinary week: your work or business location, family visits, school or care needs, errands, and time at home. This can reveal whether convenience, room, or flexibility matters most.",
      "Then picture a less ordinary week, such as a busy season at work or a longer stay away for an OFW or seafarer. Consider how easy the property would be to look after when you are not there.",
      "Compare the full cost of living in each option, not only the asking price. Include recurring dues, utilities, transport, maintenance, parking, and any immediate repairs or improvements you expect.",
      "A comfortable budget should leave room for normal life after the purchase. If one option only works by stretching every month, it may not be the right fit even if its features look appealing.",
      "When viewing, bring the same checklist for every property type so the comparison stays fair. Note what you liked, what needs checking, and what you would need to change before moving in.",
      "Ask clear questions about what is included, what remains to be completed, and which documents or property details you should review. Take time to verify information rather than relying on a quick impression.",
      "It can help to rate each option against your own priorities: daily convenience, privacy, space, upkeep, flexibility, and total ongoing costs. Weight the priorities that matter most to you instead of treating every feature as equal.",
      "You do not have to decide from a brochure or a single viewing. A thoughtful comparison can show that two very different property types both deserve a closer look—or that one is not suited to your needs right now.",
      "If you are still exploring, that is useful information too. Understanding your preferences before you commit can make the next viewing more focused and less overwhelming.",
      "For more practical property decision tips and local perspectives, visit the Facebook Page."
    ],
    "subject": "Which Home Type Fits the Way You Live?",
    "title": "A practical comparison of houses, condos, townhouses, and lots"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 17,
    "paragraphs": [
      "A home can look spacious during a viewing and still feel awkward in everyday use. The best test is not simply how many rooms it has, but how well those rooms support the things you do each day.",
      "Start by picturing an ordinary weekday, from getting ready in the morning to winding down at night. Imagine where you would put your things, where you would move, and which parts of the home you would use most.",
      "Think through your morning routine in order: waking up, getting dressed, preparing food, and heading out. Notice whether the bedroom, bathroom, kitchen, and exit connect in a way that feels workable for your household.",
      "If several people will share the home, consider where your routines overlap. One bathroom or a narrow passage may matter more at busy times than the floor area suggests.",
      "Walk the route from the entrance to the spaces you expect to use often. Ask whether bags, shoes, groceries, or other everyday items have a sensible place without blocking movement.",
      "In the kitchen, look beyond the cabinets and finishes. Consider whether there is enough usable counter space, whether the refrigerator and cooking area are easy to reach, and where you would keep daily essentials.",
      "Picture carrying groceries from the door to the kitchen. Turns, steps, narrow corridors, or doors that swing into the route can make a small task feel less convenient over time.",
      "Think about how you eat at home. A dining area does not have to be formal, but it should fit the way you plan to have meals, whether that means a table, a compact counter, or flexible seating.",
      "If you work or study at home, identify a spot where you can focus and store what you need. Consider light, noise from nearby rooms, and whether the space can serve that purpose without disrupting other routines.",
      "For shift workers, seafarers, or anyone with changing hours, rest may happen while other people are active. Notice whether a bedroom is separated from the noisiest shared areas and whether window coverings can help manage light.",
      "Storage is part of how a layout functions. Check where luggage, work equipment, cleaning supplies, laundry, and seasonal belongings could go, rather than assuming they will fit wherever there is spare floor space.",
      "Open a few cabinets and closets if the viewing allows it, and notice their depth and access. A storage nook that is difficult to reach may be less useful than a smaller, well-placed cupboard.",
      "Pay attention to the path between the bedroom and bathroom, and between the laundry area and places where clothes are used. These everyday routes can reveal whether the arrangement feels convenient for your household.",
      "Observe how daylight enters the rooms at the time of your visit, while remembering that light changes during the day. Also listen for sounds from shared walls, corridors, roads, or common areas that could affect how you use a space.",
      "In a compact home, flexible furniture and multi-purpose areas can help, but measure before relying on them. Check that a bed, table, or desk can fit while leaving comfortable paths to doors and windows.",
      "If the property is unfinished or staged, mentally remove the display furniture and assess the actual room dimensions. Ask for measurements where available, and compare them with furniture you already own or expect to use.",
      "Try a simple exercise: list three routines that matter most to you, then identify where each would happen in the home. Any awkward transitions or missing storage are useful questions to explore, not automatic reasons to rule it out.",
      "You can also note possible adjustments, such as adding shelves or changing furniture placement. Separate easy, modest changes from work that may require permission, additional cost, or professional assessment.",
      "A clear picture of your daily routines can help you compare homes on more than appearance. It gives you practical criteria to discuss with the people supporting your property search.",
      "Take your time noticing how a space might feel on an ordinary day, not just during a viewing. For more practical property guidance, visit our Facebook Page."
    ],
    "subject": "Will This Layout Work With Your Everyday Life?",
    "title": "A Practical Way to Assess Layout and Space"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 18,
    "paragraphs": [
      "A property decision is easier to live with when it reflects the people who will share the home—not only the person making the purchase.",
      "Start by listing who will live there now and who may reasonably join the household later, such as a child, parent, or relative visiting for extended periods.",
      "Think through a typical weekday from morning to evening: who needs to get ready, where meals happen, and whether anyone works or studies from home.",
      "A second bedroom can serve more than one purpose, but consider whether a work desk, guest bed, and storage can coexist without making the room difficult to use.",
      "If family members have different schedules, notice whether the layout offers places to rest or take calls without everyone competing for the same space.",
      "For children, look beyond the bedroom count: safe play areas, practical storage, and a manageable route to school or childcare may matter just as much.",
      "If an older family member may live with you, consider stairs, bathroom access, doorways, and how close the bedroom is to shared spaces.",
      "Household routines also shape the kitchen you need, from meal preparation and grocery storage to room for more than one person to help.",
      "Check whether laundry, drying clothes, and storing cleaning supplies feel workable, especially if these tasks are part of a busy family routine.",
      "Privacy deserves a place on the list too: consider where people can study, pray, rest, or have a quiet conversation.",
      "Make a short must-have list together, then separate genuine needs from preferences that could be flexible if the right home offers other advantages.",
      "Ask each household member what would make daily life easier, and listen for practical concerns that may not appear in a property listing.",
      "When viewing a home, walk through it as a household: imagine where bags go, how people move through the rooms, and where everyone gathers.",
      "Pay attention to shared spaces at the times you expect to use them; a layout that looks spacious when empty can feel different during a busy morning.",
      "Consider how the surrounding area supports your family’s routine, including transport, schools, groceries, healthcare, and access to relatives who lend a hand.",
      "For Cavite and nearby areas, compare the actual routes and travel times your household depends on rather than choosing by distance alone.",
      "Include household priorities in your comfortable budget, while leaving room to assess move-in needs, furnishings, maintenance, and other costs beyond the listed price.",
      "If you are an OFW, seafarer, or often away for work, think about who will oversee the home and whether its upkeep fits the people staying there.",
      "You do not need to settle every future question before exploring; a clear view of today’s needs and likely changes can help you compare options calmly.",
      "A thoughtful home choice is one where the household’s real routines feel considered, so take time to notice what matters most to the people who will call it home."
    ],
    "subject": "A Home That Fits the Whole Household",
    "title": "Make room for everyone’s everyday needs"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 19,
    "paragraphs": [
      "When two properties both look promising, it can be hard to remember what truly separates them after several viewings.",
      "A simple side-by-side comparison can turn scattered impressions into a calmer, more practical decision.",
      "Start by writing down the purpose for each option: a home to live in, a place near work, a future family home, or a property you hope to hold as an asset.",
      "Your purpose helps you choose which details deserve the most attention, rather than treating every feature as equally important.",
      "Compare the full cost picture, not only the advertised price or monthly payment estimate.",
      "Include any known fees, parking or association charges, likely move-in work, and a sensible allowance for ongoing upkeep; ask the seller or authorized representative what is and is not included.",
      "Use the same budget assumptions for each property so the comparison stays fair.",
      "If a figure is uncertain, label it as an estimate and note who can confirm it instead of quietly treating it as final.",
      "Next, compare location in terms of your actual routine: commute, access to transport, nearby essentials, and how often you travel to other parts of Cavite or beyond.",
      "For OFWs, seafarers, or busy professionals, consider who will check on the property while you are away and how convenient visits or coordination would be.",
      "During viewings, use the same checklist for every option: natural light, ventilation, water flow, visible signs of damp, storage, noise, and the condition of shared spaces.",
      "Take notes and photos where permitted, and record what you could not inspect so you can ask follow-up questions later.",
      "Separate must-haves from preferences before comparing amenities.",
      "A feature that looks attractive in a brochure may matter less than a layout that supports your daily life or a location that fits your responsibilities.",
      "Add a column for questions and verification, such as title or project documents to review, turnover details, or the status of repairs.",
      "Have the appropriate professionals or authorized parties clarify matters that need formal confirmation; a comparison sheet is a planning aid, not a substitute for due diligence.",
      "You can also score each option against a few priorities you chose in advance, such as affordability, location, condition, and fit for purpose.",
      "Keep the scoring simple, and write a brief reason beside each rating so the numbers do not hide important context.",
      "If one option leads only because of a single appealing feature, pause and revisit the trade-offs; if neither fits comfortably, continuing your search is a valid choice.",
      "A thoughtful comparison does not force a decision—it helps you see what to ask next and choose at a pace that feels right."
    ],
    "subject": "A clearer way to compare properties",
    "title": "Put your property options side by side"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 20,
    "paragraphs": [
      "A low asking price can be appealing, especially when you are trying to keep a property decision sensible. But the purchase price is only one part of what a home will ask of you.",
      "Two properties with similar layouts may differ in location, condition, monthly dues, access, and the work they need before they feel comfortable. Those differences can shape everyday life long after viewing day.",
      "Start by naming what the property needs to do for you. Is it a place to live near work or family, a home base for visits from abroad, or a step toward building assets responsibly?",
      "Once the purpose is clear, it becomes easier to distinguish a useful compromise from a costly mismatch. A smaller unit near your routine may serve you better than a larger one that makes daily travel difficult.",
      "Look at the full cost of ownership, not only the amount on the listing. Ask what fees, utilities, maintenance, parking, and move-in expenses may apply, and which figures are confirmed versus still estimates.",
      "A lower-priced home that needs repairs may still be worth considering, but the condition deserves a closer look. Note visible issues and ask what inspections or documentation are available before assuming the work will be minor.",
      "Location has trade-offs of its own. Compare the route to work, transport options, essential services, and the places you regularly visit at the times you would actually travel.",
      "In Cavite and nearby areas, a map can help you shortlist, but it cannot tell the whole story. If possible, visit the neighborhood and notice traffic, noise, drainage, lighting, and how the surroundings feel at different hours.",
      "A seemingly affordable choice may also involve a longer commute or fewer convenient services. Consider whether the time and effort fit your real schedule, especially if you travel often or work irregular hours.",
      "If you are an OFW or seafarer, think through how the home will be checked, maintained, and accessed while you are away. Clear arrangements with trusted people can matter as much as the property’s initial price.",
      "For business owners and young professionals, flexibility can be valuable. Consider whether the space and location will still make sense if your work pattern, household needs, or plans change.",
      "At a viewing, compare features against your needs rather than against the most impressive detail. A fresh finish may catch the eye, while storage, ventilation, water access, or the building’s upkeep may be more consequential day to day.",
      "Write down the trade-offs you notice while they are fresh. A simple list of benefits, concerns, open questions, and possible extra costs can make several options easier to compare calmly.",
      "Give each concern a next step. You might request a breakdown of recurring charges, ask about repair history, check the route at peak time, or confirm which documents you should review.",
      "Avoid treating an unanswered question as a small detail just because the price looks attractive. If an important point remains unclear, pause your comparison until you have enough information to understand it.",
      "You do not need to find a property with no compromises. The aim is to choose trade-offs you understand and can live with, rather than letting a low price make the decision for you.",
      "It can help to set your comfortable overall budget before comparing homes. That boundary gives you room to weigh costs and priorities without stretching simply because one option seems like a bargain.",
      "When you compare, use the same criteria for every property: purpose, total costs, condition, location, access, and unresolved questions. Consistency makes the differences more visible than relying on memory or first impressions.",
      "Take the time you need to gather information and discuss the choice with people you trust. A thoughtful decision can be a good one even when it is not the cheapest available option.",
      "For more practical property reminders and updates around Cavite and nearby areas, visit our Facebook Page when it suits you."
    ],
    "subject": "When the Cheapest Home Isn’t the Best Fit",
    "title": "Look Beyond the Price Tag"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 21,
    "paragraphs": [
      "A property conversation can suddenly feel urgent: a unit may be described as nearly gone, a price as available only today, or a decision as something you need to make before you have time to think.",
      "It is reasonable to pause when you feel rushed. A meaningful property decision deserves room for questions, especially when it affects your budget and plans for years to come.",
      "Start by separating the deadline from the decision. Ask what exactly expires, when it expires, and whether the date is written in an official offer or simply being communicated verbally.",
      "Then ask what changes if you wait a day or two. The answer may be a specific, documented change—or it may be that you lose the chance to consider the offer calmly.",
      "Request the important details in writing: total price, payment schedule, reservation terms, inclusions, fees, and the conditions for cancellation or refund, if applicable.",
      "A low advertised amount can be only one part of the picture. Clarify what you may need to pay at reservation, during construction, at turnover, and afterward.",
      "If a representative says a unit is the last one, ask how availability is confirmed and when the information was last updated. Availability can change, so make sure you understand what is being held and for how long.",
      "Try not to let another buyer’s supposed interest set your own pace. Your readiness depends on your goals, resources, and understanding—not on someone else’s timeline.",
      "A useful pause is not the same as rejecting the opportunity. It is a chance to check whether the property fits the purpose you had in mind, whether that is a home, a future move, or a considered asset.",
      "Compare the offer with your comfortable budget, including recurring costs and expenses beyond the quoted price. If the numbers only work under best-case assumptions, take that as a reason to examine them further.",
      "For OFWs and seafarers making decisions from a distance, ask for current documents, clear photos or a live video walkthrough, and a reliable way to verify the details independently.",
      "If you cannot attend a viewing yourself, consider who you trust to inspect the property and what you want them to check. A quick tour may not answer questions about access, surroundings, or practical fit.",
      "Write down your unanswered questions before speaking with the seller or agent again. A short list helps keep the conversation focused when the other person is moving quickly.",
      "You can say, “Thank you for explaining the deadline. I need the full terms in writing and time to review them before deciding.” A clear, polite boundary is enough.",
      "If someone discourages you from reading documents, consulting a qualified professional, or asking basic questions, notice that. Pressure should not replace clear information and your own judgment.",
      "Avoid making a commitment just to keep a conversation pleasant. You can appreciate someone’s help while still choosing not to reserve or proceed until you feel informed.",
      "When possible, discuss the decision with someone who understands your priorities and will not benefit from your purchase. A calm second perspective can help you spot what you may have overlooked.",
      "Keep notes of what was promised, by whom, and when; save messages and copies of documents. For terms with legal or financial consequences, seek guidance from an appropriately qualified professional.",
      "Most importantly, let your decision reflect your plan rather than the pressure of the moment. A property that fits your purpose and realistic budget is worth evaluating carefully.",
      "If urgency is making it hard to think clearly, give yourself permission to step back, verify the facts, and choose your next question before choosing a property."
    ],
    "subject": "When a Property Decision Feels Urgent",
    "title": "Responding thoughtfully to urgency and sales pressure"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 22,
    "paragraphs": [
      "A property decision can feel clearer when you sort what you know from what you have heard or inferred.",
      "For any home you are considering, make three simple lists: verified facts, estimates, and open questions.",
      "Verified facts are details supported by a reliable document or direct confirmation, such as the stated floor area on an official plan or the current asking price from the seller or authorized representative.",
      "An estimate is a useful working figure, not a guarantee; examples include a rough renovation budget, travel time during typical traffic, or an initial monthly payment calculation.",
      "An assumption is something that may sound plausible but has not yet been checked, such as believing a quoted price includes all fees or that a nearby road will stay quiet.",
      "When someone shares a detail, note who provided it, when they provided it, and whether you have seen supporting information.",
      "For costs, distinguish the amount you have confirmed from items that still need a quote or professional review.",
      "Depending on the property and transaction, additional costs may include taxes, documentation, association dues, utilities, maintenance, or repairs; ask which apply rather than treating a general list as final.",
      "For financing, label online calculators and informal estimates as preliminary, then confirm eligibility, rates, terms, and required documents directly with the relevant provider.",
      "For location, visit at different times if practical and check the routes, services, and everyday conveniences that matter to your routine.",
      "A map can show distance, but it cannot confirm your actual commute, the feel of a neighborhood, or how accessible a service will be at the time you need it.",
      "During a viewing, record what you observe yourself separately from what the seller or representative tells you.",
      "If you notice a damp patch, unusual odor, or visible wear, record the observation without jumping to a diagnosis; ask what inspection or qualified assessment may clarify it.",
      "Keep copies or notes of written quotations, property details, and answers, and mark anything that is verbal or still awaiting confirmation.",
      "A simple status label—confirmed, estimated, or pending—can prevent a hopeful guess from quietly becoming part of your budget or plan.",
      "When answers conflict, pause and ask for clarification in writing before relying on either version.",
      "You do not need to resolve every open question in one day; identify which uncertainties could change your comfort, costs, or next step.",
      "For technical, legal, or tax questions, seek guidance from the appropriate qualified professional for your situation rather than relying on a general conversation.",
      "This habit is especially helpful when you are balancing work, family responsibilities, or time away from home: clear notes make it easier to resume your research without pressure.",
      "Thoughtful decisions are built not only on promising possibilities, but also on knowing which details are confirmed and which still deserve a closer look."
    ],
    "subject": "What’s Confirmed—and What Still Needs Checking",
    "title": "Separate Facts from Assumptions Before You Decide"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 23,
    "paragraphs": [
      "Buying from another country or while working at sea can make a property search feel like a lot to manage from a distance.",
      "A simple plan can help you use your time well, ask better questions, and avoid feeling rushed into a decision.",
      "Start by writing down what the property is meant to do for you: become a future home, a place for family, or a long-term asset you hope to build responsibly.",
      "That purpose will guide which locations and property features deserve your attention first.",
      "Choose a comfortable price range before browsing listings, and leave room for fees, moving costs, repairs, and other expenses that may come with a purchase.",
      "If you are comparing financing options, confirm current requirements and figures directly with the relevant provider rather than relying on an old estimate or someone else’s experience.",
      "Next, narrow your search to a few areas in Cavite or nearby that fit your daily-life priorities, such as access to work, family, transport, schools, or essential services.",
      "For each area, note what matters most to you and what you are willing to trade off, such as a longer commute for more space.",
      "Ask for current listing details in writing, including the exact location, total price, floor area, lot area if applicable, and what is included in the quoted amount.",
      "Request recent photos or a live video walkthrough, but treat them as an early screening step rather than a substitute for checking the property in person.",
      "During a virtual viewing, ask the person on site to show the street approach, nearby surroundings, room corners, ceilings, windows, plumbing fixtures, and any visible signs of wear.",
      "It can help to prepare a short checklist in advance so you can compare properties consistently instead of relying on memory after several calls.",
      "Ask about practical details that are easy to overlook on screen, including mobile signal, water and power arrangements, access during heavy rain, and nearby construction or noise.",
      "If possible, arrange for someone you trust to visit the area or property and share their own observations; make sure they know what you specifically want them to check.",
      "Keep a record of listings, dates, answers, and follow-up questions in one place, and label which information has been confirmed and which still needs checking.",
      "Before making commitments, understand the steps, documents, costs, and timelines involved, and get qualified help for questions that require professional financial or legal guidance.",
      "Avoid sending money or personal documents simply because a listing looks appealing or a deadline is mentioned; independently verify who you are dealing with and what the payment is for.",
      "If your schedule is unpredictable, tell your property contact your preferred times, time zone, and the best way to reach you, then agree on a realistic response window.",
      "A thoughtful search does not need to happen all at once: you can shortlist, verify, compare, and decide at a pace that fits your circumstances.",
      "If you would like a starting point for exploring Cavite options, visit our Facebook Page and take a look when it suits you."
    ],
    "subject": "A Smarter Property Search, Even From Far Away",
    "title": "Plan Your Cavite Property Search from Anywhere"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 24,
    "paragraphs": [
      "A focused property search does not have to take over your calendar. A few clear decisions can help you use limited time well.",
      "Start by writing down the purpose of the property: a future home, a place for family, or a considered addition to your assets. That purpose will help you sort meaningful options from distracting ones.",
      "Choose a comfortable monthly amount before browsing listings. Leave room in your thinking for costs beyond the advertised price, so the search stays grounded in your real life.",
      "Set aside one short planning block each week, even 15 or 20 minutes. Use it to review options and decide the next small step rather than trying to research everything at once.",
      "Keep your must-haves to a short list. For example, note the areas you can realistically reach, the number of bedrooms you need, and any essential access or layout requirements.",
      "Separate must-haves from preferences such as a balcony, a particular finish, or extra storage. That distinction makes it easier to compare homes fairly when time is tight.",
      "Choose a manageable search area based on your regular routes and responsibilities. For buyers in Cavite and nearby areas, commute patterns and access to daily essentials may matter as much as the listing photos.",
      "Use listing alerts or saved searches with your chosen location, budget range, and key features. A smaller stream of relevant options is easier to review than a constant flood of updates.",
      "When a listing catches your eye, take a few minutes to check the basics first. Confirm the location, stated price, property type, and details that affect your must-haves before arranging a viewing.",
      "Keep a simple comparison note on your phone or in a spreadsheet. Record the listing, area, price, questions, and what fits or does not fit your priorities.",
      "Try a quick first-pass screen: does this option suit your purpose, fit your comfortable range, and merit learning more? If one answer is unclear, write down what you need to verify.",
      "Batch questions instead of sending them one by one throughout the day. A short list about availability, viewing arrangements, and costs can make each conversation more efficient.",
      "Plan viewings around a realistic route or a time when you are already nearby, if possible. Grouping visits can reduce travel and make comparisons easier while the details are fresh.",
      "Before confirming a visit, ask what you should expect to see and whether there are specific details worth checking. That helps you arrive prepared without turning a viewing into a rushed decision.",
      "If your schedule is unpredictable, ask whether an initial remote conversation or a video walkthrough is available. It can help you decide whether an in-person visit is worth setting aside time for.",
      "Leave space between viewings to take notes and consider your impressions. A packed itinerary may look productive but can make homes blur together.",
      "After each viewing, note what you liked, what concerned you, and what remains unanswered. Separate observable facts from first impressions so you can revisit the choice calmly.",
      "Give yourself permission to pause when a property does not meet your priorities. A focused search is not about seeing everything; it is about giving thoughtful attention to suitable possibilities.",
      "Your timeline can guide the pace. Whether you are balancing work, a business, or commitments overseas, steady progress is more useful than pressure to decide before you are ready.",
      "If you would like to explore options in Cavite and nearby areas, you can connect with me on Facebook. We can start with your priorities and a pace that works for you."
    ],
    "subject": "A Property Search That Fits Your Week",
    "title": "Make Your Search Work Around Your Schedule"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 25,
    "paragraphs": [
      "When a property is described as an investment, it is worth pausing to ask what that means for you.",
      "A thoughtful decision starts with clear questions—not a promise about what a home or unit might earn later.",
      "First, what role would you want the property to play: a place to live, a future home for family, or an asset you may rent out?",
      "Your intended use can shape which locations, property types, and timelines deserve a closer look.",
      "If you are considering renting it out, ask who might realistically want to rent in that area and what kinds of homes they look for.",
      "Nearby workplaces, transport links, schools, and everyday services may help you understand the local context, though they cannot guarantee demand.",
      "Ask what similar properties are currently being offered for rent, and remember that asking prices are not proof of what a tenant will pay.",
      "It can also help to learn how long comparable homes have been listed and what features appear to matter to renters.",
      "Look beyond the purchase price and ask about recurring costs such as association dues, maintenance, insurance, and utilities during vacant periods.",
      "Some expenses may arise irregularly, so ask what repairs or upkeep the property could need over time.",
      "If the property is still being developed, clarify the expected turnover timeline and what could affect it.",
      "Ask which details are written into the developer’s documents, and take time to review them before making a commitment.",
      "Consider how you would manage the property if you live elsewhere or work at sea, including tenant communication and repair coordination.",
      "You might compare self-management with available property-management services, while checking their scope and fees directly.",
      "A useful question is how long you could comfortably hold the property if renting it out takes longer than expected.",
      "That reflection can help you assess whether the commitment fits your budget and life plans without relying on optimistic assumptions.",
      "You can also ask what information is still missing, and what would make you pause or seek independent professional guidance.",
      "No single listing or projection can settle every question, but a careful conversation can reveal what you need to verify next.",
      "Sheila Mae Fajutagana, The Financially Savvy Realtor, can help you explore property options in Cavite and nearby areas at a pace that feels comfortable.",
      "For more thoughtful property conversations and local updates, visit the Facebook Page."
    ],
    "subject": "Questions to Ask Before Considering a Property an Investment",
    "title": "Explore the Questions, Not the Promises"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 26,
    "paragraphs": [
      "Buying a home is a milestone, and caring for it is the next chapter. A little planning can make the responsibilities feel more manageable.",
      "Before you commit, ask what routine upkeep the property is likely to need. The answer may differ for a house, a condominium, or a townhouse.",
      "For a house, think about the roof, gutters, plumbing, electrical fixtures, paint, and outdoor areas. For a condo, check which repairs are handled by the association and which remain yours.",
      "Ask for any available maintenance records, repair receipts, warranties, and appliance manuals. These can help you understand what has been serviced and what may need attention.",
      "During a viewing, look beyond the finishes: notice signs of leaks, dampness, cracks, poor drainage, or worn fixtures. If something is unclear, ask the seller or agent what is known about it.",
      "Consider arranging an appropriate professional inspection before purchase, where available. A qualified inspector can help identify issues that are not easy to spot during a quick visit.",
      "If the property is in a subdivision or condominium, request the current rules and details of recurring association dues. Ask what those dues cover and whether there are other shared costs to understand.",
      "Clarify who is responsible for shared spaces, building systems, security, waste collection, and repairs. Knowing the boundaries can prevent surprises after move-in.",
      "Make a simple home-care calendar for recurring tasks, such as checking for leaks, cleaning drains, servicing equipment, and inspecting exposed areas after heavy rain.",
      "Keep a folder for property documents, service contacts, warranties, receipts, and maintenance notes. A clear record makes it easier to track what has been done and when.",
      "Set aside room in your household plan for upkeep, not just the monthly housing payment. The amount and timing will depend on the property, its condition, and your own circumstances.",
      "Some expenses arrive predictably, while others are unexpected. A reserve can help you prepare for repairs without treating every small issue as an emergency.",
      "If you will be away for work or overseas, consider who can check on the home and respond if a leak, power issue, or other problem arises. Agree on access and contact arrangements in advance.",
      "For a property that may be vacant between visits, ask about practical safeguards such as secure locks, regular checks, and how utilities should be managed. Follow the building or community’s applicable rules.",
      "Keep important service numbers handy, including the property manager or association, utility providers, and trusted maintenance professionals. Confirm their contact details rather than relying only on old listings.",
      "When comparing properties, include the likely effort of maintaining them alongside location, layout, and purchase costs. A home that suits your routines may be easier to care for over time.",
      "You do not need to know how to fix everything yourself. The useful first step is understanding what to monitor and when to bring in a qualified professional.",
      "For repairs involving safety, structural concerns, or specialized systems, avoid guesswork and seek an appropriately qualified person. Ask for a clear explanation of the issue and proposed work.",
      "A thoughtful maintenance plan is part of choosing a home that fits your life. It can help you feel prepared without expecting every detail to be predictable.",
      "If you’re exploring homes in Cavite or nearby areas, you’re welcome to follow along for practical property reminders and local updates."
    ],
    "subject": "A Home Comes with a Care Plan",
    "title": "Planning for the Responsibilities After Purchase"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 27,
    "paragraphs": [
      "A property decision does not have to arrive all at once. Often, it becomes clearer through a series of useful conversations.",
      "You might begin by talking with someone you trust about what you want a home or investment to make possible in your life.",
      "Try putting your purpose into everyday words: a place closer to work, a future home for your family, or a first step toward building assets responsibly.",
      "That purpose can help you ask more focused questions when exploring homes in Cavite and nearby areas.",
      "In another conversation, discuss what monthly amount would feel comfortable—not simply the maximum amount someone might approve.",
      "Include the costs around the purchase in that discussion, such as fees, moving expenses, furnishings, and ongoing upkeep.",
      "If you are an OFW or seafarer, you may want to talk through how your income schedule and time away could affect the way you manage a property.",
      "For business owners and young professionals, consider how changing work plans or family needs might shape the location and type of home that makes sense.",
      "You do not need to settle every question in one sitting. A short conversation that reveals one missing detail is real progress.",
      "When comparing areas, ask what your ordinary week would look like there: the commute, access to essentials, and time spent getting around.",
      "A map can start the discussion, but a visit can add context that is hard to see on a screen.",
      "During a viewing, make room for practical questions about the layout, natural light, ventilation, storage, and the condition of the property.",
      "If something is unclear, write it down rather than feeling pressured to decide on the spot.",
      "Afterward, talk through what you noticed while the details are still fresh: what felt useful, what concerned you, and what you would like to verify.",
      "It can help to separate confirmed information from assumptions, especially when a detail could affect your budget or plans.",
      "Ask the relevant professionals or property representatives for clarification when a question needs an authoritative answer.",
      "You can also compare a few options using the same simple criteria, so each conversation adds insight instead of more noise.",
      "A thoughtful next step might be gathering a cost estimate, revisiting an area, or arranging another viewing—not making a final commitment.",
      "There is no need to rush your pace. The goal is to make each conversation leave you better informed and more comfortable with the next question.",
      "One useful conversation at a time can turn a big property decision into a process you can approach with care."
    ],
    "subject": "One Useful Conversation at a Time",
    "title": "A thoughtful property decision can start with one good conversation"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 28,
    "paragraphs": [
      "As you think about property, it can help to pause and check whether your priorities still feel right.",
      "Plans change as work, family, and everyday responsibilities shift. Revisiting your reasons is a practical step, not a sign that you are falling behind.",
      "Start with the purpose you had in mind: a home to live in, a place for your family, or a long-term asset you hope to build responsibly.",
      "Ask yourself what a good outcome would look like in your life, beyond the property itself. More space, a manageable commute, or a steadier plan may matter more than a particular feature.",
      "Then separate your must-haves from your preferences. A second bedroom might be essential for your household, while a balcony may be a welcome extra.",
      "Consider who else is part of the decision and what they need from the property. A conversation now can make later comparisons clearer and more considerate.",
      "Your budget deserves the same fresh look. What felt comfortable earlier may need adjusting if your income, obligations, savings, or plans have changed.",
      "Think about the full cost of ownership, not only the advertised price or monthly payment. Fees, upkeep, utilities, moving expenses, and furnishing can affect how comfortable a choice feels.",
      "Rather than stretching to match someone else’s expectations, decide what level of commitment still leaves room for your other responsibilities and goals.",
      "Location priorities can change, too. Recheck how often you travel, where you work, which services you rely on, and how much time you want to spend commuting.",
      "For Cavite and nearby areas, compare places according to your actual routines, not just a map or a single visit. Traffic patterns, transport options, and daily conveniences may deserve a closer look.",
      "If you are an OFW or seafarer, consider how the property will fit the times you are away and the support available when you are not nearby.",
      "If you are a young professional or business owner, also consider how your work arrangements and near-term plans could affect the space and location you need.",
      "Give each priority a simple label: essential, important, or flexible. This makes trade-offs visible without pretending that every choice can meet every preference.",
      "You can also write down what would make you pause or reconsider. Clear boundaries help you stay grounded when a property is appealing but not quite suited to your circumstances.",
      "If you have been viewing properties, look back at your notes and ask whether the same criteria still guide your decisions. Update them before arranging more visits.",
      "A short list of questions can help during a viewing: What costs should I confirm? What details about the area should I check at different times? What information do I still need before comparing options?",
      "For anything involving contracts, taxes, or financing terms, seek guidance from the appropriate qualified professional. Taking time to understand the details is part of making a thoughtful decision.",
      "You do not need to settle every question today. Even a brief priorities check can help you choose a useful next step, whether that is researching an area, reviewing your budget, or simply waiting until your plans are clearer.",
      "If you would like to keep exploring thoughtful property decisions around Cavite and nearby areas, visit our Facebook Page for more helpful updates."
    ],
    "subject": "Before You Move Forward, Check What Matters Most",
    "title": "A fresh look at your priorities"
  },
  {
    "cta": "Visit our Facebook Page",
    "day": 29,
    "paragraphs": [
      "A property decision often gets clearer when you have room to talk it through without feeling pushed toward a purchase.",
      "If you’re considering a home or investment in Cavite or nearby areas, I’d be glad to have a helpful, no-pressure conversation with you.",
      "You don’t need to arrive with a complete plan or a list of properties. A few questions or a rough idea of what you’re hoping for is enough to begin.",
      "We can start with the reason you’re exploring property now: a place to live, a future home for your family, or a first step toward building assets responsibly.",
      "Your timeline matters, too. Whether you’re only beginning to look or hoping to move within a particular season, we can talk about what preparation makes sense at this stage.",
      "We can also discuss a comfortable budget range—not just the amount you might borrow or spend, but the monthly commitment that feels manageable alongside your other priorities.",
      "It helps to leave room for costs beyond the listed price, such as fees, recurring charges, moving expenses, and any improvements a property may need.",
      "If you work overseas, sail for extended periods, or run a business, we can consider how your schedule and availability may shape the search and viewing process.",
      "For young professionals balancing career plans with a first purchase, we can outline what information to gather before comparing options.",
      "If you’re buying for family needs, we can talk through practical details like commute, access to daily essentials, and how the space may suit your household over time.",
      "For a business owner, the conversation can begin with how the property would fit your plans and what questions you still need answered before deciding.",
      "We can look at areas in Cavite and nearby communities through the lens of your priorities, rather than treating every listing as an equal fit.",
      "That might mean comparing travel routes, neighborhood conveniences, property types, or the trade-offs between location and space.",
      "When you’re ready to view a property, a little preparation can make the visit more useful: note what you want to inspect, what to ask, and what you’d like to compare afterward.",
      "You can also bring the questions you’ve been hesitant to ask, including what information is still missing or what feels uncertain.",
      "I can help organize the discussion and point out considerations to explore, while leaving the decisions and pace entirely with you.",
      "A conversation doesn’t commit you to a viewing, an application, or a purchase. It’s simply a chance to get clearer about your next sensible step.",
      "If you’d like to talk, visit our Facebook Page and reach out in the way that feels comfortable for you.",
      "You might share the area you’re considering, your general purpose, and one question you’d most like to answer first.",
      "Whenever you’re ready, we can make the conversation useful, straightforward, and centered on what matters to you."
    ],
    "subject": "A Property Conversation, at Your Pace",
    "title": "A Property Conversation, at Your Pace"
  },
  {
    "day": 30,
    "subject": "A thoughtful next step, whenever you are ready",
    "title": "Keep your priorities at the center.",
    "paragraphs": [
      "Thank you for taking a little time to explore your property plans with me. A search can begin with excitement and quickly become a lot of information to sort through.",
      "Listings, prices, locations, and advice can all compete for your attention. It is understandable if you still have questions or are not sure what to do next.",
      "You do not need to have every answer before taking a useful next step. Start by reminding yourself what you want a property to make possible.",
      "That purpose can help you decide which options deserve a closer look. A home for your family may call for different priorities than a rental property or a long-term investment.",
      "Your priorities are personal, and they can change as your life changes. Give yourself room to name what matters most to you right now.",
      "Your budget deserves the same careful attention. Think about a payment that feels manageable alongside your everyday responsibilities, savings goals, and family needs.",
      "Remember that the listed price may not include every cost connected with buying or owning a property. Ask which fees, taxes, dues, or maintenance costs may apply.",
      "Confirm important figures and requirements with the relevant qualified professionals. A clear question is more useful than relying on a guess.",
      "The location matters beyond the map pin in a listing. Consider how it may fit your commute, errands, family routines, and preferred way of living.",
      "A visit to the area can sometimes reveal details a photo cannot show. Think about what you need nearby and what you could comfortably do without.",
      "When you view a property, look beyond the first impression. Notice the layout, condition, surroundings, and practical details that affect daily use.",
      "Write down anything you want to verify instead of relying on memory. You are allowed to ask for more information before deciding.",
      "You are also allowed to compare one option with another. A simple checklist can make those comparisons easier to follow.",
      "Use the same questions for each property so the differences are easier to see. Note what fits your goals and what still needs to be clarified.",
      "Not having an answer yet does not mean you have to rush. It simply shows you where to focus your next question.",
      "A thoughtful decision is built from details, not pressure. Take time to review information and speak with people you trust.",
      "You can move forward when the choice feels aligned with your circumstances. If you are still exploring, that is a perfectly reasonable place to be.",
      "If you are ready to take a next step, you do not have to figure it out alone. You are welcome to reply, call, or book a consultation.",
      "I will be glad to listen to your questions and help you organize the options without pressure. The aim is to help you see your choices more clearly.",
      "I hope your next property decision supports the life and future you are working toward. Whenever you would like another conversation, you are welcome to reach out."
    ],
    "cta": "Visit our Facebook Page"
  }
];

function authorizeSheilaPhotoAccess() {
  const photo = DriveApp.getFileById(CONFIG.SHEILA_PHOTO_FILE_ID).getBlob();
  if (!photo) throw new Error('Hindi mabasa ang Sheila photo sa Google Drive.');
  return 'Sheila photo access is ready.';
}

function setupEmailSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Ikabit muna ang Apps Script sa Google Sheet.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  const leads = getOrCreateSheet_(ss, CONFIG.SHEET_NAME, LEAD_HEADERS);
  const events = getOrCreateSheet_(ss, CONFIG.EVENTS_SHEET_NAME, EVENT_HEADERS);
  [leads, events].forEach(function (sheet) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#081222').setFontColor('#ffffff');
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  });
  ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === 'sendDueSequenceEmails';
  }).forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendDueSequenceEmails').timeBased().everyDays(1).atHour(9).create();
  return { spreadsheetUrl: ss.getUrl(), message: 'Setup complete.' };
}

function doPost(e) {
  try {
    const data = parseRequest_(e);
    if (String(data.action || '').toLowerCase() === 'unsubscribe') {
      return json_({ ok: unsubscribeLead_(data.email) });
    }
    const email = String(data.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ ok: false, error: 'Maglagay ng valid na email address.' });
    }
    const lead = upsertLead_(data, email);
    let ownerNotified = false;
    try { notifyOwner_(data, email, lead.id); ownerNotified = true; }
    catch (err) { logEvent_(lead.id, email, 'owner', 'New landing-page lead', 'error', errorText_(err)); }

    let leadEmailSent = false;
    if (lead.consent && lead.status === 'Active') {
      try { sendSequenceEmail_(lead, EMAIL_SEQUENCE[0]); leadEmailSent = true; }
      catch (err) { saveLeadError_(lead.row, err); }
    }
    return json_({ ok: true, leadId: lead.id, ownerNotified: ownerNotified, leadEmailSent: leadEmailSent,
      message: 'Natanggap ang submission. Tingnan ang inbox at spam/promotions folders.' });
  } catch (err) {
    console.error(err.stack || err);
    return json_({ ok: false, error: errorText_(err) });
  }
}

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  if (String(p.action || '').toLowerCase() === 'unsubscribe') {
    const ok = unsubscribeLead_(p.email);
    return HtmlService.createHtmlOutput(ok ? 'Naka-unsubscribe ka na. Hindi ka na makakatanggap ng follow-up emails.' : 'Hindi makita ang email sa listahan.');
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sheila Mae Fajutagana | Financially Savvy Realtor')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function parseRequest_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (raw) { try { return JSON.parse(raw); } catch (_) {} }
  return (e && e.parameter) || {};
}

function upsertLead_(data, email) {
  const sheet = getSheet_(CONFIG.SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][4] || '').trim().toLowerCase() === email) { row = i + 1; break; }
  }
  const isNew = row < 0;
  const now = new Date();
  const previous = isNew ? [] : sheet.getRange(row, 1, 1, LEAD_HEADERS.length).getValues()[0];
  const id = isNew ? Utilities.getUuid() : previous[0];
  const consent = data.consent === false || String(data.consent).toLowerCase() === 'false' ? false : true;
  const status = !isNew && (previous[7] === 'Unsubscribed' || previous[12]) ? 'Unsubscribed' : 'Active';
  const record = [
    id, isNew ? now : previous[1], data.firstName || data.first_name || '', data.lastName || data.last_name || '', email,
    data.phone || '', consent, status, isNew ? now : previous[8], isNew ? now : previous[9],
    isNew ? '' : previous[10], isNew ? -1 : previous[11], isNew ? '' : previous[12], '', now
  ];
  if (isNew) { sheet.appendRow(record); row = sheet.getLastRow(); }
  else sheet.getRange(row, 1, 1, record.length).setValues([record]);
  return { id: id, email: email, row: row, isNew: isNew, consent: consent, status: status,
    firstName: data.firstName || data.first_name || 'there' };
}

function notifyOwner_(data, email, id) {
  const name = [data.firstName || data.first_name || '', data.lastName || data.last_name || ''].join(' ').trim() || '(walang pangalan)';
  const phone = String(data.phone || '').trim();
  const source = data.source || 'Landing page';
  const received = new Date().toLocaleString('en-PH', { timeZone: CONFIG.TIMEZONE });
  const subject = 'Bagong landing-page inquiry: ' + name;
  const lines = [
    'May bagong nag-submit sa landing page mo.', '', 'Pangalan: ' + name, 'Email: ' + email,
    'Telepono: ' + (phone || '(hindi ibinigay)'), 'Lead ID: ' + id,
    'Source: ' + source, 'Natanggap: ' + received
  ];
  const sheilaPhoto = getSheilaPhotoBlob_();
  const html = buildOwnerNotificationHtml_({ name: name, email: email, phone: phone, id: id, source: source, received: received }, !!sheilaPhoto);
  const options = { htmlBody: html };
  if (sheilaPhoto) options.inlineImages = { sheilaPhoto: sheilaPhoto };
  GmailApp.sendEmail(CONFIG.OWNER_NOTIFY_EMAIL, subject, lines.join('\n'), mailOptions_(options));
  logEvent_(id, email, 'owner', subject, 'sent', 'Owner notification');
}

function buildOwnerNotificationHtml_(lead, includePhoto) {
  const safeName = escapeHtml_(lead.name);
  const safeEmail = escapeHtml_(lead.email);
  const safePhone = escapeHtml_(lead.phone || '(hindi ibinigay)');
  const safeSource = escapeHtml_(lead.source);
  const safeReceived = escapeHtml_(lead.received);
  const safeId = escapeHtml_(lead.id);
  const phoneLink = lead.phone ? 'tel:' + String(lead.phone).replace(/[^+0-9]/g, '') : '';
  const phoneButton = phoneLink ? '<a href="' + escapeHtml_(phoneLink) + '" style="display:inline-block;background:#081222;color:#fff;text-decoration:none;padding:13px 22px;border-radius:24px;font-size:14px;font-weight:bold;margin:0 5px 8px">Call lead</a>' : '';
  const portrait = includePhoto ? '<img src="cid:sheilaPhoto" width="108" alt="Sheila Mae Fajutagana" style="display:block;width:108px;max-width:100%;height:auto;border-radius:8px;margin:0 auto 10px">' : '';
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#eee9dc;font-family:Arial,Helvetica,sans-serif;color:#444">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eee9dc"><tr><td align="center">' +
    '<table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#f5f2e8;border:1px solid #e1ddcf;border-radius:0 0 10px 10px;overflow:hidden">' +
    '<tr><td align="center" style="background:#081222;padding:22px 20px 26px">' +
    '<div style="display:inline-block;max-width:100%;background:#f5f2e8;padding:8px 12px;border-radius:8px;margin:0 auto 12px">' +
    '<img src="' + escapeHtml_(CONFIG.LOGO_URL) + '" width="360" alt="The Financially Savvy Realtor logo" style="display:block;width:360px;max-width:100%;height:auto;margin:0 auto"></div>' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#e8e5dc;text-transform:uppercase">FINANCIALLY SAVVY REALTOR</div></td></tr>' +
    '<tr><td style="padding:34px 32px 20px;background:#f5f2e8">' +
    '<div style="display:inline-block;background:#f4e8c8;color:#765719;padding:7px 12px;border-radius:14px;font-size:11px;font-weight:bold;letter-spacing:.8px;text-transform:uppercase;margin:0 0 18px">Landing page &nbsp;•&nbsp; New lead</div>' +
    '<h1 style="font-size:24px;line-height:1.3;color:#081222;margin:0 0 12px">May bagong nag-submit sa landing page mo.</h1>' +
    '<p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 24px">Narito ang detalye ng bagong inquiry para madali mo itong ma-review at ma-follow up.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffdf8;border:1px solid #e1ddcf;border-radius:10px">' +
    '<tr><td style="padding:20px 22px 8px;font-size:11px;letter-spacing:1px;color:#9b772b;text-transform:uppercase;font-weight:bold">Contact details</td></tr>' +
    '<tr><td style="padding:8px 22px;border-top:1px solid #eee8d9"><div style="font-size:11px;color:#888;margin-bottom:5px">PANGALAN</div><div style="font-size:16px;font-weight:bold;color:#182235">' + safeName + '</div></td></tr>' +
    '<tr><td style="padding:8px 22px;border-top:1px solid #eee8d9"><div style="font-size:11px;color:#888;margin-bottom:5px">EMAIL</div><div style="font-size:15px"><a href="mailto:' + encodeURIComponent(lead.email) + '" style="color:#173b69;text-decoration:underline">' + safeEmail + '</a></div></td></tr>' +
    '<tr><td style="padding:8px 22px;border-top:1px solid #eee8d9"><div style="font-size:11px;color:#888;margin-bottom:5px">TELEPONO</div><div style="font-size:15px;color:#182235">' + (phoneLink ? '<a href="' + escapeHtml_(phoneLink) + '" style="color:#173b69;text-decoration:underline">' + safePhone + '</a>' : safePhone) + '</div></td></tr>' +
    '<tr><td style="padding:8px 22px;border-top:1px solid #eee8d9"><div style="font-size:11px;color:#888;margin-bottom:5px">SOURCE</div><div style="font-size:15px;color:#182235">' + safeSource + '</div></td></tr>' +
    '<tr><td style="padding:8px 22px;border-top:1px solid #eee8d9"><div style="font-size:11px;color:#888;margin-bottom:5px">NATANGGAP</div><div style="font-size:15px;color:#182235">' + safeReceived + '</div></td></tr>' +
    '<tr><td style="padding:8px 22px 20px;border-top:1px solid #eee8d9"><div style="font-size:11px;color:#888;margin-bottom:5px">LEAD ID</div><div style="font-family:monospace;font-size:12px;color:#555;word-break:break-all">' + safeId + '</div></td></tr>' +
    '</table>' +
    '<div style="text-align:center;padding:24px 0 8px"><a href="mailto:' + encodeURIComponent(lead.email) + '" style="display:inline-block;background:#c99a3a;color:#fff;text-decoration:none;padding:13px 22px;border-radius:24px;font-size:14px;font-weight:bold;margin:0 5px 8px">Reply to lead</a>' + phoneButton + '</div>' +
    '<div style="text-align:center;padding:10px 0 20px">' + portrait + '<div style="font-family:Georgia,serif;font-style:italic;color:#c99a3a;font-size:17px">Sheila Mae Fajutagana</div><div style="font-size:11px;letter-spacing:.8px;color:#777;text-transform:uppercase;margin-top:4px">THE FINANCIALLY SAVVY REALTOR</div></div>' +
    '</td></tr>' +
    '<tr><td style="background:#081222;padding:20px 24px;text-align:center;color:#9aa2ae;font-size:11px;line-height:1.7">Automatic owner notification from The Financially Savvy Realtor.<br>&copy; ' + new Date().getFullYear() + ' Sheila Mae Fajutagana — Cavite &amp; Nearby Areas.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function sendDueSequenceEmails() {
  const sheet = getSheet_(CONFIG.SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const today = startOfDay_(new Date());
  let sent = 0;
  for (let i = 1; i < rows.length && sent < CONFIG.DAILY_SEND_LIMIT; i++) {
    const r = rows[i], row = i + 1;
    if (!r[4] || r[7] !== 'Active' || r[12] || r[6] === false) continue;
    const start = startOfDay_(new Date(r[8] || r[1]));
    const days = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    const lastDay = r[11] === '' || r[11] === null ? -1 : Number(r[11]);
    const step = EMAIL_SEQUENCE.find(function (s) { return days >= s.day && s.day > lastDay; });
    if (!step || (r[9] && startOfDay_(new Date(r[9])) > today)) continue;
    try {
      sendSequenceEmail_({ id: r[0], email: String(r[4]).trim(), row: row, firstName: r[2] || 'there' }, step);
      sent++;
    } catch (err) { saveLeadError_(row, err); }
  }
  return { sent: sent };
}

function resendDay1ForJjLeadOnce() {
  const targetId = '22d88019-331f-499c-bf55-57836766a51a';
  const sheet = getSheet_(CONFIG.SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]) !== targetId) continue;
    if (r[7] !== 'Active' || r[6] === false || String(r[6]).toUpperCase() === 'FALSE') {
      throw new Error('Hindi na active o walang consent ang lead; hindi ipinadala.');
    }
    if (Number(r[11]) >= 1) throw new Error('Naipadala na ang Day 1 dati; hindi uulitin.');
    const lead = { id: targetId, email: String(r[4]).trim(), row: i + 1, firstName: r[2] || 'there' };
    sendSequenceEmail_(lead, EMAIL_SEQUENCE[0]);
    return 'Day 1 email sent once to the pending lead.';
  }
  throw new Error('Hindi makita ang pending lead record.');
}

function sendSequenceEmail_(lead, step) {
  const firstName = String(lead.firstName || 'there').trim() || 'there';
  const subject = step.subject.replace(/{{firstName}}/g, firstName);
  const text = buildTextEmail_(step, firstName, lead.email);
  const sheilaPhoto = getSheilaPhotoBlob_();
  const html = buildHtmlEmail_(step, firstName, lead.email, !!sheilaPhoto);
  const options = { htmlBody: html };
  if (sheilaPhoto) options.inlineImages = { sheilaPhoto: sheilaPhoto };
  GmailApp.sendEmail(lead.email, subject, text, mailOptions_(options));
  const now = new Date();
  const nextDate = new Date(startOfDay_(now).getTime() + 86400000);
  const sheet = getSheet_(CONFIG.SHEET_NAME);
  sheet.getRange(lead.row, 10, 1, 6).setValues([[nextDate, now, step.day, '', now, '']]);
  logEvent_(lead.id, lead.email, step.day, subject, 'sent', 'Sequence email sent');
}

function mailOptions_(extra) {
  const opts = Object.assign({ name: CONFIG.FROM_NAME, from: CONFIG.SENDER_EMAIL,
    replyTo: CONFIG.REPLY_TO || CONFIG.SENDER_EMAIL }, extra || {});
  return opts;
}

function getSheilaPhotoBlob_() {
  try {
    return DriveApp.getFileById(CONFIG.SHEILA_PHOTO_FILE_ID).getBlob();
  } catch (err) {
    console.warn('Sheila photo was skipped because Drive access is not authorized: ' + String(err && err.message || err));
    return null;
  }
}

function buildTextEmail_(step, firstName, email) {
  const unsub = unsubscribeUrl_(email);
  return 'Hi ' + firstName + ',\n\n' + step.title + '\n\n' + step.paragraphs.join('\n\n') +
    '\n\nVisit our Facebook Page: ' + CONFIG.FACEBOOK_URL +
    (CONFIG.YOUTUBE_URL ? '\nYouTube: ' + CONFIG.YOUTUBE_URL : '') +
    '\nCall Sheila — ' + CONFIG.PHONE +
    '\n\nSheila Mae Fajutagana\nThe Financially Savvy Realtor\nHonest Guidance • Trusted Advice • With You Every Step' +
    '\n\nUnsubscribe: ' + unsub;
}

function buildHtmlEmail_(step, firstName, email, includePhoto) {
  const paragraphs = step.paragraphs.map(function (p) {
    return '<p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#454545">' + escapeHtml_(p) + '</p>';
  }).join('');
  const youtube = CONFIG.YOUTUBE_URL ? '<a href="' + escapeHtml_(CONFIG.YOUTUBE_URL) + '" style="display:inline-block;background:#e60000;color:#fff;text-decoration:none;padding:10px 18px;border-radius:22px;font-size:13px;font-weight:bold">YouTube</a>' : '';
  const callUrl = 'tel:' + CONFIG.PHONE.replace(/[^+0-9]/g, '');
  const portrait = includePhoto ? '<div style="text-align:center;margin:0 auto 26px"><img src="cid:sheilaPhoto" width="180" alt="Sheila Mae Fajutagana" style="display:block;width:180px;max-width:100%;height:auto;border-radius:8px;margin:0 auto"></div>' : '';
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#eee9dc;font-family:Arial,Helvetica,sans-serif;color:#444">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eee9dc;padding:0"><tr><td align="center">' +
    '<table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#f5f2e8;border:1px solid #e1ddcf;border-radius:0 0 10px 10px;overflow:hidden">' +
    '<tr><td align="center" style="background:#081222;padding:22px 20px 26px">' +
    '<div style="display:inline-block;max-width:100%;background:#f5f2e8;padding:8px 12px;border-radius:8px;margin:0 auto 12px">' +
    '<img src="' + escapeHtml_(CONFIG.LOGO_URL) + '" width="360" alt="The Financially Savvy Realtor logo" style="display:block;width:360px;max-width:100%;height:auto;margin:0 auto">' +
    '</div>' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#e8e5dc;text-transform:uppercase">FINANCIALLY SAVVY REALTOR</div></td></tr>' +
    '<tr><td style="padding:38px 36px 20px;background:#f5f2e8">' +
    '<p style="margin:0 0 30px;font-size:15px;line-height:1.6;color:#454545">Hi ' + escapeHtml_(firstName) + ',</p>' +
    paragraphs +
    '<p style="margin:0 0 14px"><a href="' + escapeHtml_(CONFIG.FACEBOOK_URL) + '" style="display:inline-block;background:#c99a3a;color:#fff;text-decoration:none;padding:15px 30px;border-radius:24px;font-size:14px;font-weight:bold">Visit our Facebook Page</a></p>' +
    '<p style="margin:0 0 26px"><a href="' + escapeHtml_(callUrl) + '" style="display:inline-block;background:#081222;color:#fff;text-decoration:none;padding:15px 30px;border-radius:26px;font-size:14px;font-weight:bold">&#128222; Call Sheila — ' + escapeHtml_(CONFIG.PHONE) + '</a></p>' +
    portrait +
    '<div style="text-align:center;margin:0 auto 20px"><img src="' + escapeHtml_(CONFIG.LOGO_URL) + '" width="110" alt="Sheila Mae Fajutagana" style="display:block;width:110px;max-height:48px;object-fit:contain;margin:0 auto 8px;color:#444;font-size:11px"><div style="font-family:Georgia,serif;font-style:italic;color:#c99a3a;font-size:17px">Sheila Mae Fajutagana</div><div style="font-size:11px;letter-spacing:.8px;color:#777;text-transform:uppercase">THE FINANCIALLY SAVVY REALTOR</div></div>' +
    '<p style="text-align:center;margin:0 0 26px;font-size:12px;color:#777">&#129309; Honest Guidance &nbsp;•&nbsp; &#128737; Trusted Advice &nbsp;•&nbsp; &#11088; With You Every Step</p>' +
    '<div style="border-top:1px solid #ded9ca;padding-top:25px;text-align:center"><div style="font-family:Georgia,serif;font-style:italic;color:#c99a3a;font-size:19px">Sheila Mae Fajutagana</div><div style="font-size:11px;color:#777;letter-spacing:.6px;margin:4px 0 18px">THE FINANCIALLY SAVVY REALTOR</div>' +
    '<a href="' + escapeHtml_(CONFIG.FACEBOOK_URL) + '" style="display:inline-block;background:#1877f2;color:#fff;text-decoration:none;padding:11px 19px;border-radius:22px;font-size:13px;font-weight:bold;margin:0 5px 8px">Facebook</a>' +
    (youtube ? youtube : '') + '</div></td></tr>' +
    '<tr><td style="background:#081222;padding:20px 24px;text-align:center;color:#9aa2ae;font-size:11px;line-height:1.7">You received this because you requested information from The Financially Savvy Realtor.<br><a href="' + escapeHtml_(unsubscribeUrl_(email)) + '" style="color:#e6c25f;text-decoration:underline">Unsubscribe</a><br><br>&copy; ' + new Date().getFullYear() + ' Sheila Mae Fajutagana — The Financially Savvy Realtor. Cavite &amp; Nearby Areas.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function unsubscribeUrl_(email) {
  const base = CONFIG.WEB_APP_URL && !CONFIG.WEB_APP_URL.startsWith('ILAGAY_DITO') ? CONFIG.WEB_APP_URL : ScriptApp.getService().getUrl();
  return base + '?action=unsubscribe&email=' + encodeURIComponent(email);
}

function unsubscribeLead_(email) {
  const sheet = getSheet_(CONFIG.SHEET_NAME), values = sheet.getDataRange().getValues();
  const target = String(email || '').trim().toLowerCase();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][4] || '').trim().toLowerCase() === target) {
      sheet.getRange(i + 1, 8).setValue('Unsubscribed');
      sheet.getRange(i + 1, 13).setValue(new Date());
      sheet.getRange(i + 1, 15).setValue(new Date());
      logEvent_(values[i][0], target, 'unsubscribe', 'Unsubscribe', 'completed', 'Lead unsubscribed');
      return true;
    }
  }
  return false;
}

function saveLeadError_(row, err) {
  const message = errorText_(err);
  getSheet_(CONFIG.SHEET_NAME).getRange(row, 14).setValue(message);
  getSheet_(CONFIG.SHEET_NAME).getRange(row, 15).setValue(new Date());
  const values = getSheet_(CONFIG.SHEET_NAME).getRange(row, 1, 1, LEAD_HEADERS.length).getValues()[0];
  logEvent_(values[0], values[4], 'sequence', 'Email send failed', 'error', message);
}
function logEvent_(id, email, day, subject, result, details) {
  getSheet_(CONFIG.EVENTS_SHEET_NAME).appendRow([new Date(), id, email, day, subject, result, details || '']);
}
function getSheet_(name) {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Walang spreadsheet. Patakbuhin muna ang setupEmailSystem().');
  return ss.getSheetByName(name) || getOrCreateSheet_(ss, name, name === CONFIG.SHEET_NAME ? LEAD_HEADERS : EVENT_HEADERS);
}
function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}
function startOfDay_(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function errorText_(err) { return String(err && err.message ? err.message : err); }
function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

// Manual test. Nagpapadala ito sa address na ilalagay mo; hindi ito ginagamit ng trigger.
function testSendEmailToYourself() {
  const testAddress = CONFIG.OWNER_NOTIFY_EMAIL;
  GmailApp.sendEmail(testAddress, 'Test: 30-Day Email Sender',
    'Test email ito ng sender. Kapag natanggap mo ito, gumagana ang Gmail authorization at sender configuration.',
    mailOptions_({ htmlBody: '<p>Test email ito ng <b>30-Day Email Sender</b>.</p>' }));
  return 'Test email sent to ' + testAddress;
}
