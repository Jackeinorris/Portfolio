// Publica o site só a partir de um estado que já está no GitHub.
//
//   npm run deploy               confere o git, gera o site, roda os testes e publica
//   npm run deploy -- --check    faz todas as verificações, sem publicar
//
// Por quê: o wrangler publica a pasta como ela está, não o commit. Em outubro de 2026 um deploy feito
// a partir de uma pasta atrasada em relação ao GitHub desfez no ar quatro commits do mapa (o Worker
// dos vídeos pelo R2 inclusive). Por isso o deploy só sai quando a pasta é exatamente o origin/master:
// sem mudanças locais, sem commits por puxar e sem commits por enviar.
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REMOTE = "origin";
export const BRANCH = "master";
const MAX_LISTED = 15;

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function firstLine(error) {
  return String(error.stderr || error.message).trim().split("\n")[0];
}

function listed(lines) {
  const shown = lines.slice(0, MAX_LISTED).map((line) => `      ${line}`);
  if (lines.length > MAX_LISTED) shown.push(`      … e mais ${lines.length - MAX_LISTED}`);
  return shown.join("\n");
}

// Arquivos modificados, apagados ou novos (não ignorados) na pasta de trabalho.
export function pendingChanges(cwd) {
  const out = git(cwd, ["status", "--porcelain", "--untracked-files=all"]).replace(/\s+$/, "");
  return out ? out.split("\n") : [];
}

// Lista o que impede o deploy; vazia = a pasta é exatamente o remote/branch.
export function checkRepo(cwd, { remote = REMOTE, branch = BRANCH } = {}) {
  const problems = [];
  let current;
  try {
    current = git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  } catch {
    return ["Esta pasta não é um repositório git."];
  }
  if (current !== branch) {
    problems.push(`Você está em "${current}", e o deploy só sai do "${branch}". Rode: git switch ${branch}`);
  }

  const changes = pendingChanges(cwd);
  if (changes.length) {
    problems.push(`Há mudanças que não estão em commit, e o wrangler as publicaria do jeito que estão:\n${listed(changes)}\n    Faça commit (ou desfaça) e rode de novo.`);
  }

  try {
    git(cwd, ["fetch", "--quiet", remote, branch]);
  } catch (error) {
    problems.push(`Não consegui consultar o ${remote} (${firstLine(error)}). Sem isso não dá para saber se a pasta está em dia com o GitHub.`);
    return problems;
  }

  const [ahead, behind] = git(cwd, ["rev-list", "--left-right", "--count", `HEAD...${remote}/${branch}`])
    .trim().split(/\s+/).map(Number);
  if (behind) {
    problems.push(`A pasta está ${behind} commit(s) atrás do ${remote}/${branch}. Publicar agora desfaria no ar o que já está lá. Rode: git pull --rebase`);
  }
  if (ahead) {
    problems.push(`Há ${ahead} commit(s) que ainda não estão no ${remote}. Envie antes, senão um deploy feito de outro lugar os desfaz. Rode: git push`);
  }
  return problems;
}

function fail(messages) {
  console.error(`\n✖ Deploy cancelado; nada foi publicado.\n${messages.map((m) => `  - ${m}`).join("\n")}`);
  process.exit(1);
}

function step(label, command, args, options = {}) {
  console.log(`\n▸ ${label}`);
  return spawnSync(command, args, { cwd: ROOT, stdio: "inherit", ...options }).status === 0;
}

function main() {
  const checkOnly = process.argv.includes("--check");

  console.log(`▸ Conferindo a pasta contra o ${REMOTE}/${BRANCH}`);
  const problems = checkRepo(ROOT);
  if (problems.length) fail(problems);

  if (!step("Gerando o site", process.execPath, [path.join("scripts", "build-site.mjs")])) fail(["O build falhou."]);
  const changed = pendingChanges(ROOT);
  if (changed.length) {
    fail([`O build mudou arquivos que não estão em commit:\n${listed(changed)}\n    Faça commit, git push e rode de novo.`]);
  }

  // shell: o npm é um .cmd no Windows e não roda sem shell.
  if (!step("Rodando os testes", "npm test", [], { shell: true })) fail(["Os testes falharam."]);

  const commit = git(ROOT, ["rev-parse", "--short", "HEAD"]).trim();
  if (checkOnly) {
    console.log(`\n✔ Tudo em ordem para publicar o commit ${commit} (--check: nada foi publicado).`);
    return;
  }
  if (!step(`Publicando o commit ${commit}`, "npm exec -- wrangler deploy", [], { shell: true })) {
    fail(["O wrangler deploy falhou."]);
  }
  console.log(`\n✔ Publicado o commit ${commit}, o mesmo do ${REMOTE}/${BRANCH}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
