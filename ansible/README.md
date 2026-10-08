# Ansible Phase 3

Run commands from this directory:

```bash
cd ansible
ansible-playbook -i inventories/dev/hosts.ini playbooks/bootstrap.yml
```

## Configuration and local secrets

`inventories/dev/group_vars/all.yml` holds the namespace, manifest directory, timeouts, local development endpoints, and handler-lab port. The `dev_env` tag renders `~/.config/minishop/dev.env`; it uses `MINISHOP_DEV_DATABASE_URL` from the controller environment, or a `CHANGE_ME` placeholder when unset. The directory is mode `0700` and the file is mode `0600`. The template task suppresses output so a real URL is not exposed by `--diff` or verbose logs.

The real Kubernetes Secret manifests are local-only and ignored by Git. On a fresh checkout, copy the examples and replace the placeholder `data` values with base64-encoded values for the password already used to initialize the target database. Keep the application `DATABASE_URL` password in sync (URL-encode special characters before base64-encoding it). Base64 is only an encoding; these local files remain secret and must not be committed:

```bash
cp ../k8s/examples/postgres-secret.yaml.example ../k8s/base/postgres-secret.yaml
cp ../k8s/examples/app-secret.yaml.example ../k8s/base/app-secret.yaml
```

Never commit those local files or paste secret values into command output. The example files contain placeholders only.

## Bootstrap and idempotency

The `prerequisites` role locates `kubectl`, handles the WSL-to-Windows path conversion when Docker Desktop's `kubectl.exe` is used, and checks cluster access. `minishop_bootstrap` applies PostgreSQL and app resources, then runs migration and seed Jobs only when each Job is absent. Existing Jobs are left in place: `Complete` is accepted, active Jobs are polled, `Failed` is reported, and a polling timeout fails the play.

Namespaced manifests omit `metadata.namespace`; the playbook supplies the namespace from group variables with `kubectl -n`. When applying a namespaced manifest manually, include `-n minishop` (or your configured namespace).

If a completed Job must intentionally run again, delete that Job explicitly before bootstrap:

```bash
kubectl delete job migrate -n minishop
kubectl delete job seed -n minishop
```

The seed script uses upserts. Migrations should be rerun only when intentionally applying a new migration state. Ensure the three image tags referenced by the Kubernetes manifests are available to the cluster before bootstrap.

## Checks and debugging

```bash
ansible-playbook --syntax-check -i inventories/dev/hosts.ini playbooks/bootstrap.yml
ansible-playbook --check --diff --tags dev_env -i inventories/dev/hosts.ini playbooks/bootstrap.yml
ansible-playbook -vvv -i inventories/dev/hosts.ini playbooks/bootstrap.yml
kubectl get pods,jobs,services -n minishop
kubectl logs job/migrate -n minishop
kubectl logs job/seed -n minishop
```

`--check --diff --tags dev_env` checks the local template only. Kubernetes changes use `kubectl` command tasks, which Ansible cannot safely simulate in check mode. If `kubectl` is missing, install it in WSL or update `minishop_kubectl_windows_path`; if a Windows executable rejects a manifest path, confirm `wslpath -w` works in the active WSL distribution.

## Handler lab

`playbooks/handlers-lab.yml` installs a small nginx site configuration and notifies a reload handler only when the template changes. This lab is separate from the Kubernetes bootstrap and requires sudo:

```bash
ansible-playbook -i inventories/dev/hosts.ini playbooks/handlers-lab.yml --ask-become-pass
```

## Ansible and ArgoCD ownership

This lab uses Ansible for local prerequisites, initial namespace/database setup, one-time migration/seed Jobs, and a development environment template. ArgoCD is suited to continuously reconciling Kubernetes application manifests. When ArgoCD is introduced, give each Kubernetes object one owner: move workload Service/Deployment reconciliation to ArgoCD and keep Ansible focused on prerequisites and explicitly one-time bootstrap operations.
