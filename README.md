## 🛡️ DevSecOps: Shift-Left Security Architecture

This repository implements a strict **Shift-Left Security** approach to validate software quality and cloud infrastructure before any code reaches remote branches. 

Using **Husky** as a pre-commit orchestrator, every local commit triggers a silent automated security gate:
1. **Secret Detection (TruffleHog):** Scans files for exposed API keys, environment variables, or private certificates.
2. **Next.js Quality Assurance (ESLint):** Enforces framework-specific best practices and performance optimization rules.
3. **IaC Security Auditing (Trivy):** Statically analyzes Terraform templates to prevent cloud misconfigurations (e.g., ensuring immutable AWS ECR tags under AWS-0031).
4. **Infrastructure Consistency (Terraform CLI):** Validates and formats HCL syntax prior to remote integration.

If any stage fails, the commit is safely aborted on the developer's workstation.
