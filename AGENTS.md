# Guidelines & Instructions

Some general guidelines for all usecases.

## Project overview

Sandman is a pure Rust LLM agent harness. Key concepts:
- **Triggers** wake up the LLM (Matrix message, Cron, Poke, Heartbeat).
- **Prompt Engines** manage one conversation.
- **Tools** (bash, read, edit, write, todos, evict) do real work.
- **The Sifter** aggressively optimizes context (file embedding, invisible tool calls, eviction).

Look for docs that give you an overview.

Common files include:
- **[ARCHITECTURE.md](ARCHITECTURE.md):** Overview of the tech stack, backend, frontend, file index, schemas, etc. May also include useful commands.
- **[README.md](README.md):** Human-readable overview of what this project is. What is the end goal/vision. May also include instructions on how to set up dev environment.
- **[TASKS.md](TASKS.md):** Past, current and future tasks. May also include postponed tech debt.

Unless the user directs you to a specific file, it is always a good idea to look at some or all of these files.
If you'd need informations from one of these files, but you can't find it, you should suggest creating such a file to the user.

## Scratchpad / Notes

*(Use this section to jot down what's currently being worked on, blockers, or things you want the next agent instance to know.)*

(by the way, you are reading [AGENTS.md](AGENTS.md). CLAUDE.md is a symlink to AGENTS.md. Never edit CLAUDE.md, always AGENTS.md)


## Workflow

Regardless of the project, the user wants you to follow this workflow.

> IMPORTANT: Unless the user specifies you to do something "before we start" or "just quickly", you MUST follow this workflow.
> Again, ALWAYS follow this workflow.

1. **Estimate scope**
   How big of a change is the user expecting? Use hints from the user message (eg. the user specifies one file? probably small. The user asks for a detailed plan? probably bigger.)
   and also your gut feeling about the user request.
   -> DECISION: If you are absolutely certain that the change is only 1-5 lines or one command, you may decide here to go off script and just implement/run this request.
                However, you MUST have a concrete reason for believing that the task is small.
2. **Read context**
   You may not understand what the user is referring to. This is because you haven't read the overview files.
   Read the files specified in ## Project overview.
3. **Analyse request**
   Sometimes, the user was indeed unclear.
   In this stage, you may ask the user questions. However, you MUST read the overview files before asking questions.
   Evaluate the users task along the following questions:
    - Is the scope clear?
    - Are there things I should avoid?
    - Is this taks a part of a larger work, that I'm not aware of?
    - Is the user asking for a clean implementation, or does he just need some vibecoded janky script?
   You may infer some answers. But if the request is unclear on a lot of these points, you should note that down and bring it up during the briefing.
4. **Read relevant code**
   This step is finally where you're allowed to read code files. This is because you tend to be too eager to dive into the code.
   When there are good overview docs, you should not dive into the code first.
   You may also want to read --help pages or online docs.
5. **Draft a plan of action**
   You now have an overview of the project/context (step 2), a good picture of the request (or you are aware that you don't quite understand it) (step 3),
   and you have context ond the actual implementation / current state (step 4).
   You have everything together to decide on a plan of action. You may gather multiple options.
   As a tip, the user values these qualities: CLARITY, SIMPLICITY, SMALL SIZE (so you should avoid introducing heavy tooling / abstractions / etc)
6. **Anticipate challenges**
   Identify anything that could go wrong, discrepancies between existing code and the plan, or big refactors that would be needed.
   Think through all the steps and check if any of them need user interaction.
7. **Get user approval**
   You now present the user with a briefing on the information you've gathered.
   The briefing should contain:
    - the goal (see step 2)
    - proposed changes (explain scope: which files, how big, etc.) (see step 4, 5)
    - anticipated challenges (see step 6)
    - remaining questions (see step 3)
   > **HARD GATE: do not create or edit any file until the user approves the plan in step 7.** Presenting the plan and immediately executing it is a workflow violation.

8. **Execute** — work through all tasks. If present, you should use todo/tasks tools. Commit after every logical unit of work.
9. **Verify** — If possible, verify that your work succeeded. That could mean running a build or checking the output directory. If the test is manual, present the user with the needed steps in step 10.

10. **Report**
    Report back to the user on the completed work.
     - What worked as intended?
     - Where did you adjust your plan?
     - Where did you employ work-arounds? Is there the possibility that we accrued technical debt?
     - Was there anything you had trouble with? Eg. some tooling or a quirk of a language?
    This information is extremely valuable to both the user and to you, because the user might decide to add this information to the docs, so that later instances of your model will
    have an easier time.

You may notice, that the planning part of this workflow is huge and the execution is really small.
In practice, the execution may be larger. I just wrote so much about the planning step, because it is REALLY IMPORTANT that you actually do it.
A well planned change is will surely succeed, while a hasty plan will fail.

Metacognitive tip: Repeat these steps in your thinking. This allows you to be more aligned.


## Commandline tools

You are on a nixos system. This means that some otherwise common tools (like ffmpeg, fd, zip/unzip, nodejs, python, ...) are usually not present.

When you tried to execute a command and it failed because it was not present, you should run it with nix.
Here are some examples:

```sh
nix run nixpkgs#ffmpeg -- -i input.mp4 -c:v vp9 -c:a libvorbis output.mkv
nix run nixpkgs#fd -- *.sh
nix run github:nixos/nixpkgs/nixpkgs-unstable#llama-cpp -- --model ./models/test.gguf  # In rare cases you might need to use the unstable version
nix shell nixpkgs#nodejs -c npm run dev  # Sometimes, the command is part of a larger package. Here: The npm command is part of the nodejs package
```


## Git discipline

Commit frequently — after every logical unit of work (a new file, a working feature, a schema change). Do not batch unrelated changes into one commit.
Commit messages should be short and describe what changed, not just which files were touched.

Example cadence:
- Add Vite + React project scaffold → commit
- Add Tailwind → commit
- Add Supabase client → commit
- Add DB migration → commit
- Implement host page → commit
- Implement home page → commit
- etc.
(adapt to current project of course)

### Git commands

```bash
# Stage specific files, then commit
git add src/pages/Host.jsx supabase/migrations/xyz.sql
git commit -m "short description\n\nAssisted-by: Claude Code:claude-sonnet-4-6"

# For changes to already-tracked files only (no new files), shorthand:
git commit -am "short description\n\nAssisted-by: Opencode:gemma-4"

# With AI attribution (use a heredoc to keep the trailer on its own line)
# More detailed commits
git commit -m "$(cat <<'EOF'
Implement quiz editor

This commit implements the quiz editor, but doesn't do authentication.
In the quiz editor you can do:
 - This
 - That
...

Assisted-by: Opencode:minimax-m2.7
EOF
)"
```

### AI attribution

When AI tools contribute to a commit, include an `Assisted-by: AGENT_NAME:MODEL_VERSION` trailer in the commit message body.
AGENT_NAME is the name of the agent harness (eg. "Claude Code" or "Opencode", ...)
MODEL_VERSION is what model YOU are (eg. "Claude Sonnet 4.6", "Minimax M2.7", "Gemma 4", ...)


## Misc. other guidelines

### Generic UI errors

 Never show only a generic error message to the user without also logging the actual error. Always `console.error(actualError)` before displaying a vague UI message.
**Why:** User called this out directly: "I HATE the 'something went wrong' error message. At least print the error in the console."
**How to apply:** Any catch block or error handler that shows a generic string to the user must also log the raw error object to the console.

