# Coffee Tracker

**Status:** draft, 2026-11-18.

## The pitch

Make it easy to choose and brew a good coffee in the morning, without the complexity of a
general-purpose coffee app. Keep the daily steps clear and uncluttered, while saving enough
brew history to find which beans, methods and recipes I enjoy.

## The first version

- **Brewing methods:** I can add the methods I use, such as Hario Switch, V60, OXO Rapid
  Brewer and Cafelat Robot.
- **Beans:** I can add a coffee's roaster, roast date, name, bag size, cost, region, varietal
  and tasting notes. Brew ratings come from my daily logs rather than a separate bean rating.
- **Recipes:** I can save named recipes for a method, including ratio, grinder, grind size,
  coffee dose, resulting water amount, temperature, pouring structure (including number of
  pours), bloom and total brew time, and notes. A recipe can also include method-specific
  steps, such as opening or closing the Hario Switch valve. I add the known recipes I want to
  use for each method; the useful details can become clearer as I save and use recipes.
- **Dose and water:** Before brewing, I can choose how many grams of coffee to use. The
  recipe's ratio calculates total water, and pours saved as percentages of total water scale
  to match.
- **Brew logging:** Each brew gets one simple 1-to-5 rating, with an optional
  note. The rating reflects the bean, method, recipe and how that brew turned out together.
- **Choosing a brew:** I can repeat my latest brew, try a recommended brew, or choose another
  saved recipe. I can set an active bean, which is selected by default, and switch bags easily.
- **Recommendations:** Suggest my saved recipes based on their average brew ratings. I can
  also choose any saved recipe, including ones I have not rated yet.
- **Saved online:** Everything saves to an online database as I go, so my phone and computer
  show the same beans, recipes and brews. Clearing the browser loses nothing.
- **Sign-in:** I sign in once on each device and stay signed in. Only I can see or change my
  data, even though the site's code is public.
- **Backups:** Export my data to a file, and import it again, as a safety copy.

## How it works

**Set up:**

1. I sign in on my phone and my computer.
2. I add the brewing methods I use.
3. I add the beans I have, including any details I want to remember.
4. I add the recipes I already know and want to try for each method.

**Make a brew:**

1. I choose a brewing method.
2. My active bean is already selected; I can switch to another bean.
3. I choose to repeat my latest brew, try a recommended brew, or pick another saved recipe.
4. I set today's coffee dose in grams. The recipe's ratio calculates total water and scales
   each percentage-based pour.
5. I follow the recipe and save the brew. After tasting it, I enter its 1-to-5 rating and
   optionally add a note.
6. Later, I can look at ratings for brews made with a particular bean, method and recipe.

## Rules and worked example

- A ratio of 1:15 means 15 grams of water for each gram of coffee. Total water is the coffee
  dose multiplied by the ratio's water number.
- Each pour in the recipe is saved as a percentage of total water. Its amount is that
  percentage multiplied by the calculated total water. Changing the dose scales total water
  and the pours together.
- Each completed brew gets one 1-to-5 rating. The rating is for that brew as a whole; there
  are no separate bean, method or recipe ratings.

For example, if I choose 18 g of coffee and a 1:15 recipe, the total water is 270 g. If the
saved pours are 10%, 40% and 50% of the water, they become 27 g, 108 g and 135 g. If I change
the dose to 20 g, the total becomes 300 g and those pours become 30 g, 120 g and 150 g.
These percentages illustrate the calculation, not a recommended recipe.

## Look and feel

The screens should be clean and easy to navigate, especially when first opened in the morning.
Design for a phone first, with readable recipe steps and large, easy-to-tap controls; the same
information should remain usable on desktop.

## Still to decide

- [ ] **What a brew remembers.** If I tweak the grind or dose on the day, is that saved with
  the brew? Recommended: yes. Each brew keeps a copy of the settings actually used (dose,
  grind, water), pre-filled from the recipe and editable before saving. Otherwise editing a
  recipe later rewrites history, and the tracker can't show which grind worked best.
- [ ] **Sign-in method.** Recommended: email and password. It works the same on every
  device; "email me a link" often opens in the wrong browser on a phone.
- [ ] **No internet in the kitchen.** Recommended: the site says plainly that it couldn't
  save and keeps what I typed so I can retry. Full offline use is parked.
- [ ] **Unrated brews.** I save the brew, then rate it after tasting. Recommended: a brew
  without a rating shows as "rate me" on the home screen and is left out of averages.
- [ ] **How recommendations rank.** Recommended: for the chosen method, recipes are ranked
  by average rating across all beans, showing how many brews each average is based on, so
  one lucky 5 doesn't look like a sure thing.
- [ ] **"Repeat my latest brew".** Recommended: the latest brew for the chosen method, with
  the same recipe, dose and grind.
- [ ] **Finished bags.** Recommended: I can mark a bag finished; it leaves the bean picker
  but its brews stay in the history.
- [ ] **Methods without pours.** The Cafelat Robot (and maybe the OXO) has no pours.
  Recommended: pours are optional; a recipe can be just dose, ratio and steps.

## Not in the first version

- AI suggestions to improve a brew based on its rating and notes.
- Finding and sourcing recipes online; work out the best sources and approach in a future step.
- Grinder-size comparisons that translate settings between different grinders.
- Working with no internet connection.

## Plans

Not split yet. Will be Section 1 of `docs/TOC.md`.
