# Coffee Tracker

**Status:** draft, 2026-10-31. A starting point for you to change: it's your coffee. Noah made
the first guesses about your setup, so check them under "Still to decide".

## The pitch

Log each brew and how it tasted in under 30 seconds, and get one small thing to try tomorrow,
so I can stop guessing and find the best recipe for each bag of coffee. It does less than the
big coffee apps on purpose: I choose the few features I'll really use, and the rest stay out.

## Choose what goes in

This outline holds a suggested first version, not a final one. To go through it, ask the AI:

> Follow `.claude/skills/outline/SKILL.md`. Open `docs/outlines/coffee-tracker.md`, ask me its
> "Still to decide" questions one at a time, and update the file with my answers.

For the AI doing this:

1. Ask one question at a time, with the recommended answer first.
2. Skip a question if an earlier answer has already settled it.
3. Move whatever he turns down to "Not in the first version", with a one-line reason.
4. Move anything he picks from that section into "The first version".
5. Warn him plainly if a choice breaks the rules under "Keeping it a daily habit".
6. Update the steps and the worked example so they match his answers.

## The first version

Everything here is a suggestion until he has been through "Still to decide".

- **Recipe:** pour-over only. Grind number, coffee in grams and water in grams, with the ratio
  worked out automatically.
- **Brew time:** an optional timer with one big start and stop button.
- **Beans:** name and roast date, entered once per bag. The bag's age is worked out
  automatically, and each bag remembers its best recipe.
- **Tasting:** a 1-10 score, quick taps (sour, bitter, weak, strong, balanced) and an optional
  note. A brew can be rated later.
- **Tuning:** start from the last brew or the best one, see what changed and whether the score
  went up or down, and get one suggestion for the next brew.
- **Keeping it safe:** backup and restore buttons. Clearing the browser's data would otherwise
  erase the whole log.

## How it works

**A new bag (about once every few weeks):**

1. I tap **New bag** and enter the name and roast date.
2. Its first brew starts from the best recipe of the bag before. A new bag usually needs dialing
   in again, so that's only a starting point.

**Each morning:**

1. I open the site on my phone. The top shows my current bag, its age, my last brew and one
   suggestion.
2. I tap **Brew again**, or **Best recipe** to go back to this bag's best one. The grind, coffee
   and water fill in.
3. If I'm trying something new, I change a number with plus and minus. The ratio updates.
4. I can tap the timer when I start pouring and again when it finishes. Skipping it is fine.
5. I tap **Save**.
6. When I've tasted it, I tap a score and any tastes that fit. If I'm out the door, I can do this
   later: an unrated brew waits at the top of the screen until I rate it or dismiss it.
7. The site shows what changed, whether the score went up or down, and what to try next.

## Keeping it a daily habit

- **The goal:** under 30 seconds of tapping for a repeat brew, on a phone, with wet hands. The
  brew itself doesn't count. By design, that's 4 taps: Brew again, Save, a score, a taste. Nobody
  has timed this yet, so time it during the first week. If it takes longer, cut something.
- **The daily screen stays small:** three numbers, the timer and Save, all on one phone screen.
  Everything else stays hidden until it's needed.
- **A new daily field has to earn its place:** would I still fill it in on a rushed Tuesday in
  a month? If not, it's optional or it stays out.
- **Skipping is fine:** no streaks and no reminders. Once a bag tastes right, there's little
  left to learn, and logging can wait until the next bag.
- **The biggest risk is rating:** it's a second visit to the app, after the coffee is made. If
  I stop doing one thing, it will probably be this. An unrated brew must never nag or block the
  next one.

## Rules

**The next-step suggestion** is one line that changes one thing, and it's always worded as
something to try. These rules are for pour-over only, because the fix varies by brew method. A
different method would need its own rules before it gets any suggestions.

| What I tapped | What it suggests |
|---------------|------------------|
| Sour, or weak and sour | Try a finer grind |
| Bitter | Try a coarser grind |
| Weak, not sour | Try 1 g more coffee, and leave the grind alone |
| Strong, not bitter | Try 20 g more water, and leave the grind alone |
| Balanced | Keep this recipe |
| Sour and bitter together | Mixed signals: repeat it and see |
| Nothing | No suggestion, only the score change |

- **Grind steps:** a suggestion moves the grind by my usual step, 2 numbers in the example.
- **Overshooting:** if a suggestion would land on a grind I've already tried with this bag, it
  suggests a number between the two instead. If there's no whole number between them, it says
  I may have found the right grind.
- **Best recipe:** the highest score for this bag, and the newest one if scores tie. Unrated
  brews don't count.
- **Grind numbers:** they only mean something on this grinder.

## Worked example

One bag, "Sunrise Blend", over its second week. In this example a higher grind number means
coarser, and my usual step is 2. The numbers are made up to show how the site behaves. They
aren't a recommended recipe.

| Day | Bag age | Grind | Coffee | Water | Ratio | Time | Tasted | Score | What changed | Site suggests |
|-----|---------|-------|--------|-------|-------|------|--------|-------|--------------|---------------|
| Mon | 8 days | 18 | 20 g | 320 g | 1:16 | 3:05 | sour | 6 | first brew of the bag | Try a finer grind: 16 |
| Tue | 9 days | 16 | 20 g | 320 g | 1:16 | 3:20 | sour | 7 | grind 18 to 16, score up 1 | Try a finer grind: 14 |
| Wed | 10 days | 14 | 20 g | 320 g | 1:16 | 3:45 | bitter | 5 | grind 16 to 14, score down 2 | 16 was sour and 14 bitter: try 15 |
| Thu | 11 days | 15 | 20 g | 320 g | 1:16 | 3:30 | balanced | 8 | grind 14 to 15, score up 3, new best | Keep this recipe |
| Fri | 12 days | 15 | 20 g | 320 g | 1:16 | no timer | weak | 8 | nothing, score the same, new best (newest tie) | Try 1 g more coffee: 21 g |
| Sat | 13 days | 15 | 21 g | 320 g | 1:15.2 | no timer | balanced | 9 | coffee 20 to 21 g, score up 1, new best | Keep this recipe |
| Sun | 14 days | 15 | 21 g | 320 g | 1:15.2 | no timer | balanced | 9 | nothing, score the same, new best (newest tie) | Keep this recipe |

- **Saturday:** I save the brew and leave. I rate it mid-morning, and that's when the suggestion
  appears.
- **Sunday:** a repeat brew: Brew again, Save, 9, balanced.
- **By the end of the week:** the bag's best recipe is grind 15, 21 g of coffee and 320 g of
  water. The next bag would start from there.

## Look and feel

Phone first, one-handed, wet hands: big buttons, plus and minus rather than typing. The morning
screen fits on one phone screen. Desktop shows the same thing, wider.

## Still to decide

For each question, the recommended answer comes first.

- [ ] **Is Noah's guess at your setup right?** He assumed pour-over by hand, a kitchen scale and
  one grinder with numbered settings. Recommended: keep it if it's true, and change it if it
  isn't. This question decides the most, so do it first:
  - **Drip machine:** drop the timer. The machine controls most of the brew.
  - **French press, AeroPress or espresso:** different fields and new suggestion rules.
  - **No scale:** use scoops, and drop the ratio and the 1 g suggestion.
  - **Two grinders:** each brew records which grinder it used.
  - **No numbers on the grinder, or pre-ground coffee:** grind suggestions get vague or
    disappear, so most of the point of this tracker goes with them. Think hard before going on.
- [ ] **Which way does your grinder go, and how far do you usually move it?** Recommended: a
  higher number is coarser, and the usual step is 2. Check your own grinder, because some run
  the other way. For pour-over, 2 or 3 clicks is a meaningful change on most grinders.
- [ ] **Do you want a timer?** Recommended: optional, with one button. Time helps explain a sour
  or bitter cup, but it should never hold up a brew.
- [ ] **What do you want to record about each bag?** Recommended: name and roast date. Add the
  roaster or roast level only if you'd use them to rebuy a coffee, because they don't change
  any suggestion.
- [ ] **How do you want to record taste?** Recommended: a score plus taps. A score alone can rank
  brews but can't say what to change. Taps alone can suggest but can't pick a best recipe.
- [ ] **Do you want suggestions?** Recommended: yes, one line. They need no extra entry, and
  they're the main thing a paper notebook can't do. The other choice is a plain log that shows
  only what changed and the score.
- [ ] **Do you want to rate brews later?** Recommended: yes, because coffee often gets drunk well
  after it's made. The other choice is to rate right away or not at all.
- [ ] **Should water temperature or bloom go in?** Recommended: not yet. Add one only if you
  really change it from day to day. A number that never changes is just clutter.
- [ ] **How should a new bag start?** Recommended: from the last bag's best recipe. The other
  choice is a standard starting recipe, such as 1:16.
- [ ] **How much comparing do you want?** Recommended: the last few brews of this bag, with the
  best one on top. Add more only after you've wanted it a few times.
- [ ] **Phone only, or phone and computer?** Saved in the browser, each device keeps its own
  separate log. Recommended: phone only at first, with the backup buttons, and add a database
  only if you miss it on the computer.
- [ ] **What counts as "best"?** Recommended: highest score for this bag, newest first on ties.
- [ ] **Last check: what's the fewest things you'd really enter every morning?** Recommended:
  only a score and a taste, with everything else carried over. If something on the daily screen
  fails this test, make it optional or take it out.

## Not in the first version

**Later: worth adding if I miss it**

- Other brew methods: each needs its own fields, starting values and suggestion rules.
- Scoops: only needed without a scale, so this comes back if I don't own one.
- A second grinder: its numbers don't carry over, and one grinder needs no extra tap.
- Water temperature: most mornings it won't change, so it would be clutter.
- Celsius or Fahrenheit: only matters once water temperature is in.
- Bloom: a real pour-over step, but one more field to fill in, and rarely the first thing to change.
- Comparing any two brews side by side: the last few brews should answer most questions.
- Charts: a bag only gets a handful of brews, too few to show much.

**Leave out: not wanted here**

- Pre-infusion and espresso yield: espresso only, so they come with espresso if it's ever added.
- Roaster and roast level: they don't change any suggestion, and the bag's name is enough to
  recognize it.
- Hand-marked favourites: Best recipe already repeats my top brew in one tap.
- A grams or ml setting: 1 ml of water weighs about 1 g, so grams can cover both.
- Bluetooth scales and other connected devices: Beanconqueror has these, but they're a lot of
  setup for a morning habit.
- Stock counts of beans left: they don't help me make a better cup.
- Formal tasting score sheets: far more entry than a 30-second log allows.
- Streaks and reminders: they'd turn a useful tool into a chore.

## What this is based on

**Checked on the web, 2026-10-31:**

- [Seattle Coffee Gear's pour-over guide](https://www.seattlecoffeegear.com/blogs/learning-center/how-to-dial-in-pour-over):
  the taste rules, the 1:16 starting ratio, changing one thing at a time, and grind step sizes.
  It says weak but balanced coffee needs a ratio change, not a finer grind, which is why weak
  and sour are separate rules above.
- [Beanconqueror](https://beanconqueror.com/) offers over 30 brew settings and
  [lets you keep only the ones you want](https://github.com/graphefruit/Beanconqueror) for each
  brew method. A [reviewer](https://apps.apple.com/nl/app/beanconqueror/id1445297158?l=en-GB)
  likes repeating a brew and changing only the grind, and doesn't want the smart scale features.
- [Coffee Log](https://f-droid.org/de/packages/io.github.adrian2414745.coffeelog/) shows how
  little a useful log can hold: a coffee list, a history for each, favourites, a rating and backup.

**Thinner evidence:** logging only until a bag tastes right comes from one Reddit comment seen
in a search summary. Home-Barista and Reddit blocked direct reading, so what home brewers say is
barely represented here.

**Judgment, not research:** the 30-second tap count, the "biggest risk" warning, the overshooting
rule, the 20 g of water and 1 g of coffee amounts, and the sorting into first version, later and
leave out. Try them on real mornings and change what doesn't hold up.

## Plans

Not split yet. Will be Section 1 of `docs/TOC.md`.
