# Setting Up Greenlight on a New Computer

A step-by-step checklist for setting up a new Mac, from a blank machine to Greenlight running with Claude Code. Do the steps in order. It takes about 30–45 minutes, and most of that is waiting on downloads.

> **Tip:** open this page in your browser on the new computer at
> **https://github.com/a-herman/greenlight/blob/main/docs/NEW-COMPUTER-SETUP.md**
> so you can copy and paste each command.

---

## Before you start

- [ ] **You're signed in to the new Mac** with your Accenture account, and you're on the internet.
- [ ] **You have admin rights.** Several steps ask for your Mac password. On an Accenture-managed Mac, if the password is rejected or installs are blocked, ask Accenture IT for admin access or install the apps through **Self Service**.
- [ ] **You know your sign-ins:** GitHub (`a-herman`) and your Claude account.

**How to open Terminal:** press **Cmd+Space**, type **Terminal**, and press **Enter**. You'll paste commands into Terminal throughout this guide. Paste each one and press **Enter**.

---

## Step 1: Install Apple's developer tools

**What it's for:** this installs Git, plus the compilers Greenlight needs to build its database library.

1. In Terminal, paste:
   ```bash
   xcode-select --install
   ```
2. A popup appears. Click **Install**, then **Agree**.
3. Wait for it to finish (5–15 minutes).

If it says *"command line tools are already installed"*, go on to step 2.

---

## Step 2: Install Homebrew

**What it's for:** Homebrew is the Mac's package manager. Steps 3–5 use it to install the other tools.

1. Paste:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. When it asks for your password, type your Mac password and press **Enter**. Nothing shows on screen as you type; that's normal.
3. Press **Enter** again when it asks you to confirm.
4. **Don't skip this part.** When it finishes, Homebrew shows a **"Next steps"** section. Run these two commands:
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```
5. Check that it worked:
   ```bash
   brew --version
   ```
   ✅ You should see a version number, such as `Homebrew 7.0.7`.

---

## Step 3: Install Node.js, Git and the GitHub CLI

**What they're for:** Node.js runs the app, Git handles version control, and the GitHub CLI (`gh`) signs you in to GitHub.

1. Paste:
   ```bash
   brew install node git gh
   ```
2. Check:
   ```bash
   node -v
   gh --version
   ```
   ✅ `node -v` should show `v20` or higher.

---

## Step 4: Install VS Code

1. Paste:
   ```bash
   brew install --cask visual-studio-code
   ```
2. Open **VS Code** from Applications (or Cmd+Space, then type "Visual Studio Code").
3. Turn on the `code` command so you can open projects from Terminal:
   - In VS Code, press **Cmd+Shift+P**
   - Type **`Shell Command: Install 'code' command in PATH`** and press **Enter**
4. **Quit Terminal and reopen it** (Cmd+Q, then reopen) so it picks up the new command.

---

## Step 5: Install Claude Code

### 5a. The command-line tool

1. Paste:
   ```bash
   brew install --cask claude-code
   ```
   If that fails, use the official installer instead:
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   ```
2. Check:
   ```bash
   claude --version
   ```

### 5b. Sign in

1. Paste:
   ```bash
   claude
   ```
2. A browser window opens. Sign in with your Claude account (the same one as on your old computer).
3. Back in Terminal, Claude may ask you to pick a theme and trust the folder. Accept the defaults.
4. Type `/exit` and press **Enter** to quit for now.

### 5c. The VS Code extension

1. Paste:
   ```bash
   code --install-extension anthropic.claude-code
   ```
   Or in VS Code: click the **Extensions** icon in the left sidebar (four squares), search **Claude Code**, and click **Install** on the one by **Anthropic**.

---

## Step 6: Sign in to GitHub

1. Paste:
   ```bash
   gh auth login
   ```
2. Answer the prompts with the arrow keys and **Enter**:
   - *Where do you use GitHub?* → **GitHub.com**
   - *Preferred protocol?* → **HTTPS**
   - *Authenticate Git with your GitHub credentials?* → **Yes**
   - *How would you like to authenticate?* → **Login with a web browser**
3. Terminal shows an 8-character code. Press **Enter**, paste the code into the browser page that opens, and click **Authorize**.
4. Set your name and email for commits:
   ```bash
   git config --global user.name "Andrew Herman"
   git config --global user.email "aherman407@gmail.com"
   ```
   > Your old computer committed under this personal Gmail address. To use your Accenture address instead, swap it in, and also add it to your GitHub account under **github.com → Settings → Emails**.

---

## Step 7: Download and run Greenlight

1. Download the project into your home folder:
   ```bash
   cd ~
   git clone https://github.com/a-herman/greenlight.git
   cd greenlight
   ```
2. Install the project's libraries (1–3 minutes):
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open **http://localhost:3000** in your browser.

✅ **What you should see:**
- **Dashboard:** "Copilot governance", with 7 features (Anthropic Claude in Microsoft Foundry, Sales Agent, Copilot Chat, and so on)
- **Policies** tab: "52 active rules · v1.0"

The database is created and filled automatically the first time the app runs. There's nothing to import.

To stop the app, click in Terminal and press **Ctrl+C**.

---

## Step 8: Set up your Claude Code preferences

Your old computer used the Opus model and five plugins. To set them up again:

1. Start Claude inside the project:
   ```bash
   cd ~/greenlight
   claude
   ```
2. Set the model:
   ```
   /model opus
   ```
3. Install the plugins. Type `/plugin` and press **Enter**, open the **Discover** or marketplace tab (`claude-plugins-official`), and install each of these:
   - [ ] **frontend-design**
   - [ ] **code-review**
   - [ ] **microsoft-docs**
   - [ ] **claude-code-setup**
   - [ ] **ai-firstify**

   If the marketplace isn't listed, add it first:
   ```
   /plugin marketplace add anthropics/claude-plugins-official
   ```
4. Restart Claude (`/exit`, then `claude`) so the plugins load.
5. **Optional, Figma:** if you use Figma with Claude, go to **claude.ai → Settings → Connectors** and connect Figma.

---

## Step 9: Open everything in VS Code

1. Paste:
   ```bash
   cd ~/greenlight
   code .
   ```
2. If VS Code asks *"Do you trust the authors of the files in this folder?"*, click **Yes, I trust the authors**.
3. Open Claude: click the **Claude** icon in the sidebar (or press **Cmd+Esc**).
4. To run the app from inside VS Code: **Terminal → New Terminal** from the menu bar, then `npm run dev`.

✅ Ask Claude something like *"Summarize REQUIREMENTS.md"* to confirm it's working.

---

## Step 10 (optional): Screenshot tool

You only need this to regenerate the images in `screenshots/`.

```bash
cd ~/greenlight
npm install -D playwright
npx playwright install chromium
```

Then, with `npm run dev` running in another Terminal tab:

```bash
node scripts/screenshot.mjs
```

---

## Final checklist

- [ ] `brew --version`, `node -v`, `gh --version` and `claude --version` all print versions
- [ ] VS Code opens, and `code .` works from Terminal
- [ ] `gh auth status` shows you're signed in to GitHub
- [ ] http://localhost:3000 shows 7 features, and Policies shows 52 rules
- [ ] Claude Code is signed in, on Opus, with the 5 plugins
- [ ] The Claude panel works inside VS Code

**Once this is all ticked off, you're done.** All the code and data come from GitHub, so you don't need anything from the old computer.

---

## Day-to-day commands

| What | Command (run inside `~/greenlight`) |
|---|---|
| Start the app | `npm run dev` |
| Stop the app | **Ctrl+C** in that Terminal |
| Get the latest code from GitHub | `git pull` |
| Save your changes to GitHub | `git add -A && git commit -m "describe change" && git push` |
| Start Claude | `claude` |
| Reset the app's data to the original | stop the app, then `rm -rf data`, then `npm run dev` |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `command not found: brew` | You missed the "Next steps" part of step 2. Run the two lines from step 2.4, then quit and reopen Terminal. |
| `command not found: code` | Do step 4.3 in VS Code, then quit and reopen Terminal. |
| Password rejected / "not in sudoers" / install blocked | You don't have admin rights on this Mac. Contact Accenture IT or use **Self Service**. |
| `npm install` errors mentioning `better-sqlite3`, `gyp` or `make` | Step 1 isn't finished. Run `xcode-select --install`, wait for it to complete, then `rm -rf node_modules && npm install`. |
| Still failing after that | Use Node 22 LTS: `brew install node@22 && brew unlink node && brew link --overwrite node@22`, then `rm -rf node_modules && npm install`. |
| `Port 3000 is in use` | Another copy is running. Run `lsof -ti:3000 \| xargs kill`, or use `npm run dev -- -p 3001` and open http://localhost:3001. |
| Policies page says "No policy rules yet" | Check that `policies/Microsoft Copilot Governance Checklist.xlsx` exists, then reset the data (stop the app, `rm -rf data`, `npm run dev`). |
| `git push` asks for a username or password | Run `gh auth login` again (step 6). |
| `claude` opens but says you're not logged in | Inside Claude, type `/login`. |
