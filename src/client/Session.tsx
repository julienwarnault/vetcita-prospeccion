import { useEffect, useState, type FormEvent } from "react";
import type { User } from "../shared/schemas";
import { api, ApiError } from "./api";
import App from "./App";
import Button from "./components/ui/Button";
import { Field, Input } from "./components/ui/Fields";
import { panelVariants } from "./components/ui/Panel";

export default function Session() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    const expire = () => {
      setUser(null);
      setPassword("");
    };
    window.addEventListener("session-expired", expire);
    void api
      .me()
      .then((value) => {
        if (!disposed) setUser(value);
      })
      .catch((error: unknown) => {
        if (!disposed && !(error instanceof ApiError && error.status === 401))
          setError(
            "No se pudo conectar. Recarga la página para intentar de nuevo.",
          );
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
      window.removeEventListener("session-expired", expire);
    };
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setUser(await api.login(email, password));
      setPassword("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No se pudo iniciar sesión.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api.logout();
      setUser(null);
      setError("");
    } catch {
      window.alert("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    }
  }

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center" role="status">
        Cargando…
      </main>
    );
  if (user)
    return <App key={user.id} user={user} onLogout={() => void logout()} />;
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <form
        className={panelVariants({ className: "w-full max-w-[420px]" })}
        onSubmit={login}
      >
        <p className="font-display text-2xl font-extrabold text-primary">
          vetcita
        </p>
        <h1 className="text-2xl">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-[#898594]">
          Accede a tus clínicas y visitas.
        </p>
        <Field>
          Correo electrónico
          <Input
            type="email"
            required
            autoComplete="username"
            maxLength={300}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field>
          Contraseña
          <Input
            type="password"
            required
            autoComplete="current-password"
            maxLength={1024}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error && (
          <p className="mb-4 text-sm text-[#a75b54]" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
