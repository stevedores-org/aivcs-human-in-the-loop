{
  description = "aivcs-human-in-the-loop — Human-in-the-loop UI for the agent-driven VCS";

  nixConfig = {
    extra-substituters = [ "https://nix-cache.stevedores.org" ];
    extra-trusted-public-keys = [
      "stevedores-1:ZEtb+wHYNR/LDmMDhF3/EpRZDNma8exY2b1TGZ6uS2A="
    ];
  };

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        distPath =
          let
            fromEnv = builtins.getEnv "NIX_HITL_DIST";
          in
            if fromEnv != "" then
              builtins.path {
                path = fromEnv;
                name = "hitl-dist";
              }
            else if builtins.pathExists ./dist then ./dist
            else throw ''
              dist/ is missing. Build the Vite bundle before packaging OCI:
                bun install --frozen-lockfile
                bun run build
                NIX_HITL_DIST=$PWD/dist nix build .#oci --impure
            '';

        packages = {
          # dockworker.ai OCI output (`oci.nix_output` in dockworker.toml).
          # CI runs `bun run build` (React + Vite → dist/) then Nix packages
          # the static bundle with Caddy — same pattern as inertsynergies.com.
          oci = pkgs.dockerTools.buildLayeredImage {
            name = "aivcs-human-in-the-loop";
            tag = "latest";
            maxLayers = 50;
            contents = with pkgs; [
              caddy
              cacert
            ];
            extraCommands = ''
              mkdir -p srv etc/caddy tmp
              chmod 1777 tmp
              cp -R ${distPath}/. srv/
              cp ${./Caddyfile} etc/caddy/Caddyfile
            '';
            config = {
              Cmd = [ "${pkgs.caddy}/bin/caddy" "run" "--config" "/etc/caddy/Caddyfile" ];
              User = "65532:65532";
              WorkingDir = "/srv";
              Env = [
                "XDG_DATA_HOME=/tmp"
                "XDG_CONFIG_HOME=/tmp"
              ];
              ExposedPorts = {
                "3000/tcp" = { };
              };
              Labels = {
                "org.opencontainers.image.source" =
                  "https://github.com/stevedores-org/aivcs-human-in-the-loop";
                "org.opencontainers.image.title" = "aivcs-human-in-the-loop";
                "org.opencontainers.image.description" =
                  "Human-in-the-loop UI for aivcs — agent branches, PR diffs, intent threads, CI checks, audit trail.";
                "org.opencontainers.image.licenses" = "Apache-2.0";
                "lornu.ai/component" = "aivcs-human-in-the-loop";
                "lornu.ai/managed-by" = "dockworker";
                "lornu.ai/runtime" = "caddy";
                "lornu.ai/kind" = "frontend-spa";
              };
            };
          };
        };
      in
      {
        inherit packages;

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            caddy
            skopeo
          ];
        };
      });
}
