import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { checkRepo, pendingChanges } from "./deploy.mjs";

const git = (cwd, ...args) => execFileSync("git", [
  "-c", "user.name=Teste", "-c", "user.email=teste@example.com",
  "-c", "init.defaultBranch=master", "-c", "core.autocrlf=false", ...args,
], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// Um "GitHub" local (repositório bare) e uma pasta de trabalho em dia com ele.
function repos(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-deploy-test-"));
  t.after(() => {
    // Remoção recursiva restrita ao diretório temporário deste teste.
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("portfolio-deploy-test-"));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const remote = path.join(root, "remote.git");
  git(root, "init", "--bare", "--quiet", remote);
  const clone = (name) => {
    git(root, "clone", "--quiet", remote, name);
    return path.join(root, name);
  };
  const commit = (cwd, file, text) => {
    fs.writeFileSync(path.join(cwd, file), text);
    git(cwd, "add", file);
    git(cwd, "commit", "--quiet", "-m", `edita ${file}`);
  };
  const local = clone("local");
  commit(local, "index.html", "v1\n");
  git(local, "push", "--quiet", "origin", "HEAD:master");
  return { local, clone, commit };
}

test("em dia com o origin/master: nada impede o deploy", (t) => {
  const { local } = repos(t);
  assert.deepEqual(checkRepo(local), []);
});

test("pasta atrás do GitHub: bloqueia e pede git pull --rebase", (t) => {
  const { local, clone, commit } = repos(t);
  const other = clone("outro-lugar");
  commit(other, "mapa.js", "versão nova\n");
  git(other, "push", "--quiet", "origin", "master");
  const problems = checkRepo(local);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /1 commit\(s\) atrás/);
  assert.match(problems[0], /git pull --rebase/);
});

test("commit que não foi para o GitHub: bloqueia e pede git push", (t) => {
  const { local, commit } = repos(t);
  commit(local, "ensaio.html", "novo\n");
  const problems = checkRepo(local);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /git push/);
});

test("mudanças fora de commit, inclusive arquivos novos, bloqueiam e são listadas", (t) => {
  const { local } = repos(t);
  fs.writeFileSync(path.join(local, "index.html"), "v2\n");
  fs.writeFileSync(path.join(local, "rascunho.txt"), "x\n");
  const changes = pendingChanges(local);
  assert.ok(changes.includes(" M index.html"), "mantém o espaço inicial do status");
  assert.ok(changes.includes("?? rascunho.txt"));
  const problems = checkRepo(local);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /index\.html/);
  assert.match(problems[0], /rascunho\.txt/);
});

test("outro branch: bloqueia e pede para voltar ao master", (t) => {
  const { local } = repos(t);
  git(local, "switch", "--quiet", "-c", "teste");
  const problems = checkRepo(local);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /git switch master/);
});

test("sem acesso ao remote: bloqueia, porque não dá para saber se a pasta está em dia", (t) => {
  const { local } = repos(t);
  git(local, "remote", "set-url", "origin", path.join(os.tmpdir(), "portfolio-deploy-test-inexistente.git"));
  const problems = checkRepo(local);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Não consegui consultar o origin/);
});
