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
  coffee dose, resulting water amount, temperature, pouring structure, bloom and total brew
  time, and notes. Fields that do not apply to a method can be left out.
- **Dose and water:** Before brewing, I can choose how many grams of coffee to use. The
  recipe's ratio calculates total water, and pours saved as percentages of total water scale
  to match.
- **Brew logging:** Each brew gets one simple 1-to-5 rating, with an optional
  note. The rating reflects the bean, method, recipe and how that brew turned out together.
- **Choosing a brew:** I can repeat my latest brew, try a recommended brew, or choose another
  saved recipe. My active bean is selected by default, and I can switch it.
- **Recommendations:** Show both recipes I have saved and recipes recommended from online
  sources. How online recipes are collected and shown still needs to be decided.
- **Backups:** Export and import my data. It stays in this browser and will not sync to a
  phone, computer or another browser.

## How it works

**Set up:**

1. I add the brewing methods I use.
2. I add the beans I have, including any details I want to remember.
3. I save recipes I want to repeat, or choose from recipes recommended by the tool.

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

- [ ] **How should online recipes be sourced?** Recommended: start with a small, selected set
  of recipes with a link to each source, rather than trying to collect recipes automatically
  from changing websites and Reddit posts.
- [ ] **How should recommendations use brew ratings?** Recommended: show a saved recipe's
  average rating for the same bean and method after it has enough ratings, and label recipes
  without personal ratings as untried. Decide how many ratings are enough.
- [ ] **What recipe details differ by brewing method?** Recommended: keep shared details
  together, and show method-specific steps only where they are useful. Confirm which extra
  details, if any, matter for espresso and other methods.
- [ ] **What happens when I have more than one open bag?** Recommended: let me mark one as
  active and make it easy to switch during brew setup.

## Not in the first version

- AI suggestions to improve a brew based on its rating and notes.
- Better ways to find, compare and add online recipes.
- Grinder-size comparisons that translate settings between different grinders.
- Automatic syncing between devices. The first version uses this browser's storage and relies
  on export and import for moving or backing up data.

## Plans

Not split yet. Will be Section 1 of `docs/TOC.md`.
