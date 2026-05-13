import React, { useState, useCallback, useEffect } from "react";
import { render, Box, Text, useApp, useInput, Newline } from "ink";
import {
  Select,
  ConfirmInput,
  Spinner,
  StatusMessage,
} from "@inkjs/ui";
import {
  supportedAssistants,
  planInstalls,
  checkExisting,
  runInstall,
  setupRenderer,
  type InstallOptions,
  type InstallResult,
} from "./installer.js";

type Step =
  | "select-ai"
  | "select-location"
  | "confirm-renderer"
  | "summary"
  | "installing"
  | "overwrite-prompt"
  | "done"
  | "error"
  | "cancelled";

const AI_OPTIONS = [
  { label: "Claude Code", value: "claude" },
  { label: "Codex", value: "codex" },
  { label: "Gemini CLI", value: "gemini" },
  { label: "All (install for every assistant)", value: "all" },
];

const LOCATION_OPTIONS = [
  { label: "This project", value: "project" },
  { label: "Global", value: "global" },
];

function getInstallPath(ai: string, isGlobal: boolean): string {
  const config = supportedAssistants[ai];
  if (!config) return "";
  if (isGlobal) {
    return `~/${config.globalBaseDir}/skills/excalidraw-diagram`;
  }
  return `${config.projectSkillsDir.join("/")}/excalidraw-diagram`;
}

// Excalidraw brand colors
const C = {
  brand: "#6d28d9",
  blue: "#3b82f6",
  darkBlue: "#1e40af",
  lightBlue: "#60a5fa",
  paleBlue: "#93c5fd",
  purple: "#8b5cf6",
  lightPurple: "#ddd6fe",
  slate: "#64748b",
  dark: "#1e293b",
};

const LOGO_LINES = [
  "",
  "  ███████╗ ██╗  ██╗ ██████╗  ██████╗   █████╗  ██╗    ██╗",
  "  ██╔════╝ ╚██╗██╔╝ ██╔══██╗ ██╔══██╗ ██╔══██╗ ██║    ██║",
  "  █████╗    ╚███╔╝  ██║  ██║ ██████╔╝ ███████║ ██║ █╗ ██║",
  "  ██╔══╝    ██╔██╗  ██║  ██║ ██╔══██╗ ██╔══██║ ██║███╗██║",
  "  ███████╗ ██╔╝ ██╗ ██████╔╝ ██║  ██║ ██║  ██║ ╚███╔███╔╝",
  "  ╚══════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝  ╚══╝╚══╝ ",
  "",
];

function Logo() {
  return (
    <Box flexDirection="column" alignItems="center">
      {LOGO_LINES.map((line, i) => (
        <Text key={i} color={i === 0 || i === LOGO_LINES.length - 1 ? C.brand : C.blue} bold>
          {line}
        </Text>
      ))}
      <Text color={C.lightPurple}>
        {" "}
        Excalidraw Diagram Skill
      </Text>
      <Newline />
    </Box>
  );
}

function Tips() {
  return (
    <Box flexDirection="column" marginLeft={2} marginBottom={1}>
      <Text color={C.brand} bold>
        {" "}Tips:
      </Text>
      <Text color={C.slate}>
        {" "}  1. Use arrow keys to navigate, Enter to select
      </Text>
      <Text color={C.slate}>
        {" "}  2. Press Esc at any time to cancel
      </Text>
      <Text color={C.slate}>
        {" "}  3. Run with --help for non-interactive mode
      </Text>
    </Box>
  );
}

function StepBadge({ number, active }: { number: number; active: boolean }) {
  return (
    <Text color={active ? C.brand : C.slate} bold>
      {active ? ` ❯` : "  "} {number}.{" "}
    </Text>
  );
}

function StepDivider({ active }: { active: boolean }) {
  return (
    <Box marginLeft={1}>
      <Text color={active ? C.brand : "#334155"}>
        {"╶"}
        <Text color={active ? C.brand : "#334155"}>
          {"─".repeat(48)}
        </Text>
        {"╴"}
      </Text>
    </Box>
  );
}

function BorderedBox({
  children,
  active,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  title?: string;
}) {
  const borderColor = active ? C.brand : "#334155";
  return (
    <Box flexDirection="column" marginLeft={2}>
      <Box>
        <Text color={borderColor}>{"╭"}</Text>
        <Text color={borderColor}>{"─".repeat(2)}</Text>
        {title && (
          <Text color={active ? C.brand : C.slate} bold>
            {" "}
            {title}{" "}
          </Text>
        )}
        <Text color={borderColor}>{"─".repeat(title ? 46 - title.length : 48)}</Text>
        <Text color={borderColor}>{"╮"}</Text>
      </Box>
      <Box>
        <Text color={borderColor}>{"│"} </Text>
        <Box flexDirection="column" width={47}>
          {children}
        </Box>
        <Text color={borderColor}>{" │"}</Text>
      </Box>
      <Box>
        <Text color={borderColor}>{"╰"}</Text>
        <Text color={borderColor}>{"─".repeat(48)}</Text>
        <Text color={borderColor}>{"╯"}</Text>
      </Box>
    </Box>
  );
}

function SummaryRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Box>
      <Box width={12}>
        <Text color={C.slate}>{label}</Text>
      </Box>
      <Text color={C.lightBlue} bold>
        {value}
      </Text>
      {detail && <Text color={C.slate}> {detail}</Text>}
    </Box>
  );
}

function StatusBar({ step }: { step: Step }) {
  const stepLabels: Record<string, string> = {
    "select-ai": "Choose assistant",
    "select-location": "Choose location",
    "confirm-renderer": "Renderer setup",
    summary: "Review & confirm",
    installing: "Installing...",
    "overwrite-prompt": "Confirm overwrite",
    done: "Complete",
    error: "Error",
    cancelled: "Cancelled",
  };
  return (
    <Box
      borderStyle="single"
      borderColor="#334155"
      paddingX={1}
      marginTop={1}
    >
      <Text color={C.brand} bold>
        {" "}●{" "}
      </Text>
      <Text color={C.slate}>exdraw</Text>
      <Text color="#334155">{"  │  "}</Text>
      <Text color={C.lightBlue}>{stepLabels[step] ?? step}</Text>
      <Text color="#334155">{"  │  "}</Text>
      <Text color={C.slate} dimColor>
        Press Esc to cancel
      </Text>
    </Box>
  );
}

export function App() {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>("select-ai");
  const [ai, setAi] = useState<string>("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [setupRendererFlag, setSetupRendererFlag] = useState(false);
  const [installs, setInstalls] = useState<InstallResult[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (step === "done" || step === "error" || step === "cancelled") {
      const timer = setTimeout(() => exit(), 100);
      return () => clearTimeout(timer);
    }
  }, [step, exit]);

  const handleSelectAi = useCallback((value: string) => {
    setAi(value);
    setStep("select-location");
  }, []);

  const handleSelectLocation = useCallback((value: string) => {
    setIsGlobal(value === "global");
    setStep("confirm-renderer");
  }, []);

  const handleRendererYes = useCallback(() => {
    setSetupRendererFlag(true);
    setStep("summary");
  }, []);

  const handleRendererNo = useCallback(() => {
    setSetupRendererFlag(false);
    setStep("summary");
  }, []);

  const doInstall = useCallback(
    (force: boolean) => {
      const options: InstallOptions = {
        ai,
        global: isGlobal,
        force,
        dryRun: false,
        setupRenderer: setupRendererFlag,
        target: null,
      };

      try {
        const planned = planInstalls(options);
        runInstall(options, planned);
        setInstalls(planned);

        if (setupRendererFlag) {
          const scriptsDir = planned[0].destSkillDir + "/scripts";
          try {
            setupRenderer(scriptsDir);
          } catch {
            // Renderer failure is non-fatal
          }
        }

        setStep("done");
      } catch (err: any) {
        setErrorMessage(err.message || "Installation failed");
        setStep("error");
      }
    },
    [ai, isGlobal, setupRendererFlag]
  );

  const handleInstallYes = useCallback(() => {
    setStep("installing");

    const options: InstallOptions = {
      ai,
      global: isGlobal,
      force: false,
      dryRun: false,
      setupRenderer: setupRendererFlag,
      target: null,
    };

    try {
      const planned = planInstalls(options);
      const existing = checkExisting(planned);
      if (existing) {
        setErrorMessage(existing);
        setStep("overwrite-prompt");
        return;
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Installation failed");
      setStep("error");
      return;
    }

    doInstall(false);
  }, [ai, isGlobal, setupRendererFlag, doInstall]);

  const handleInstallNo = useCallback(() => {
    setStep("cancelled");
  }, []);

  const handleOverwriteYes = useCallback(() => {
    setStep("installing");
    doInstall(true);
  }, [doInstall]);

  const handleOverwriteNo = useCallback(() => {
    setStep("cancelled");
  }, []);

  useInput((_input, key) => {
    if (key.escape) {
      setStep("cancelled");
    }
  });

  if (step === "cancelled") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Logo />
        <BorderedBox active={false}>
          <Text color={C.slate}> Operation cancelled. No changes were made.</Text>
        </BorderedBox>
        <StatusBar step={step} />
      </Box>
    );
  }

  if (step === "error") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Logo />
        <BorderedBox active={false}>
          <StatusMessage variant="error">{errorMessage}</StatusMessage>
        </BorderedBox>
        <StatusBar step={step} />
      </Box>
    );
  }

  if (step === "done") {
    const labels = installs.map((i) => i.label).join(", ");
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Logo />
        <BorderedBox active={false} title="Installed">
          <StatusMessage variant="success">
            Installed for {labels}
          </StatusMessage>
          <Newline />
          <Text color={C.slate}>
            {" "}Ask your assistant to use{" "}
            <Text color={C.brand} bold>
              /excalidraw-diagram
            </Text>
          </Text>
        </BorderedBox>
        <StatusBar step={step} />
      </Box>
    );
  }

  if (step === "installing") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Logo />
        <BorderedBox active={true}>
          <Spinner label="Installing skill files..." />
        </BorderedBox>
        <StatusBar step={step} />
      </Box>
    );
  }

  if (step === "overwrite-prompt") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Logo />
        <BorderedBox active={true} title="Existing Installation">
          <StatusMessage variant="warning">
            Skill already exists at {errorMessage}
          </StatusMessage>
          <Newline />
          <Box>
            <Text color={C.slate}> Overwrite? </Text>
            <ConfirmInput
              onConfirm={handleOverwriteYes}
              onCancel={handleOverwriteNo}
            />
          </Box>
        </BorderedBox>
        <StatusBar step={step} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Logo />

      <Tips />

      <Box flexDirection="column" marginTop={0}>
        <Box marginLeft={2}>
          <StepBadge number={1} active={step === "select-ai"} />
          <Text color={step === "select-ai" ? "white" : C.slate} bold={step === "select-ai"}>
            Choose your AI assistant
          </Text>
        </Box>
        <StepDivider active={step === "select-ai"} />
        {step === "select-ai" && (
          <Box marginTop={0} marginBottom={0}>
            <BorderedBox active={true}>
              <Select options={AI_OPTIONS} onChange={handleSelectAi} />
            </BorderedBox>
          </Box>
        )}

        {["select-location", "confirm-renderer", "summary", "installing", "overwrite-prompt"].includes(step) && (
          <>
            <Box marginLeft={2} marginTop={0}>
              <StepBadge number={2} active={step === "select-location"} />
              <Text color={step === "select-location" ? "white" : C.slate} bold={step === "select-location"}>
                Choose install location
              </Text>
            </Box>
            <StepDivider active={step === "select-location"} />
            {step === "select-location" && (
              <Box marginTop={0} marginBottom={0}>
                <BorderedBox active={true}>
                  <Select
                    options={LOCATION_OPTIONS}
                    onChange={handleSelectLocation}
                  />
                </BorderedBox>
                <Box marginTop={1} marginLeft={3}>
                  <Text color={C.slate}>
                    {" "}Project: {getInstallPath(ai, false)}
                  </Text>
                </Box>
                <Box marginLeft={3}>
                  <Text color={C.slate}>
                    {" "}Global:  {getInstallPath(ai, true)}
                  </Text>
                </Box>
              </Box>
            )}
          </>
        )}

        {["confirm-renderer", "summary", "installing", "overwrite-prompt"].includes(step) && (
          <>
            <Box marginLeft={2} marginTop={0}>
              <StepBadge number={3} active={step === "confirm-renderer"} />
              <Text color={step === "confirm-renderer" ? "white" : C.slate} bold={step === "confirm-renderer"}>
                Python renderer setup
              </Text>
            </Box>
            <StepDivider active={step === "confirm-renderer"} />
            {step === "confirm-renderer" && (
              <Box marginTop={0} marginBottom={0}>
                <BorderedBox active={true}>
                  <Text color={C.slate}>
                    Enables PNG rendering of diagrams (requires Python)
                  </Text>
                  <Newline />
                  <Box>
                    <Text color={C.slate}> Set up renderer? </Text>
                    <ConfirmInput
                      onConfirm={handleRendererYes}
                      onCancel={handleRendererNo}
                    />
                  </Box>
                </BorderedBox>
              </Box>
            )}
          </>
        )}

        {["summary", "installing", "overwrite-prompt"].includes(step) && (
          <>
            <Box marginLeft={2} marginTop={0}>
              <StepBadge number={4} active={step === "summary"} />
              <Text color={step === "summary" ? "white" : C.slate} bold={step === "summary"}>
                Review and confirm
              </Text>
            </Box>
            <StepDivider active={step === "summary"} />
            {step === "summary" && (
              <Box marginTop={0} marginBottom={0}>
                <BorderedBox active={true} title="Summary">
                  <SummaryRow
                    label="Assistant"
                    value={
                      ai === "all"
                        ? "All"
                        : supportedAssistants[ai]?.label ?? ai
                    }
                  />
                  <SummaryRow
                    label="Location"
                    value={isGlobal ? "Global" : "This project"}
                    detail={`(${getInstallPath(ai, isGlobal)})`}
                  />
                  <SummaryRow
                    label="Renderer"
                    value={setupRendererFlag ? "Yes" : "No"}
                  />
                  <Newline />
                  <Box>
                    <Text color={C.slate}> Proceed? </Text>
                    <ConfirmInput
                      onConfirm={handleInstallYes}
                      onCancel={handleInstallNo}
                      defaultChoice="confirm"
                    />
                  </Box>
                </BorderedBox>
              </Box>
            )}
          </>
        )}
      </Box>

      <StatusBar step={step} />
    </Box>
  );
}

export function run() {
  const { waitUntilExit } = render(<App />);
  waitUntilExit().then(() => process.exit(0));
}
