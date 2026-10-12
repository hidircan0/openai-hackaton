export class SimulationConfigurationError extends Error {}

export function getSimulationServiceUrl(): string {
  const configuredUrl = process.env.SIMULATION_SERVICE_URL?.trim();
  if (!configuredUrl) throw new SimulationConfigurationError("SIMULATION_SERVICE_URL tanımlı değil.");

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new SimulationConfigurationError("SIMULATION_SERVICE_URL geçerli bir URL değil.");
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const isLoopback = host === "localhost" || host === "::1" || host.startsWith("127.");
  if (process.env.VERCEL && isLoopback) {
    throw new SimulationConfigurationError("Vercel'de SIMULATION_SERVICE_URL localhost olamaz. Vercel Services içindeki simulation servisine web servis binding'ini kontrol edin.");
  }

  return configuredUrl.replace(/\/$/, "");
}
