# MaurelDev

Una alternativa personal y privada al dashboard de GitHub. Diseñado para desarrolladores que quieren una vista limpia, controles propios y datos en su propia infraestructura.

## ¿Qué es?

MaurelDev es un **dashboard self-hosted** que reemplaza la UI estándar de GitHub. Te da una interfaz simplificada para gestionar tus repositorios, issues, pull requests, estrellas y proyectos — sin ruido innecesario.

En lugar de navegar por github.com (con todas sus secciones y notificaciones), abres tu propia instancia de MaurelDev en tu servidor, ves exactamente lo que necesitas, y mantienes control total de tus datos y credenciales de GitHub.

## ¿Para quién?

- **Desarrolladores solo**: Si usas varias cuentas (personal + organizaciones) y cansas de cambiar entre contextos en GitHub.
- **Pequeños equipos**: Quieres un dashboard compartido sin pagar por GitHub Enterprise, controlando dónde corren los servidores.
- **Usuarios avanzados**: Prefieres filtros propios, vistas personalizadas y datos en tu infraestructura sobre las características por defecto de GitHub.

## ¿Qué resuelve?

| Problema | Solución |
|----------|----------|
| Ruido en la UI de GitHub | Interfaz minimalista solo con lo que necesitas |
| Múltiples cuentas es tedioso | Cambio rápido entre tu cuenta personal y tus organizaciones |
| Datos y tokens en servidores ajenos | Self-hosted en tu VPS, completo control |
| Sin filtros o vistas personalizadas | Fija repos favoritos, personaliza el tema, adapta lo que ves |

## Funcionalidades Principales

- **Autenticación segura**: OAuth con GitHub + tus tokens cifrados en tu servidor
- **Dashboard overview**: métricas rápidas (repos, estrellas, PRs abiertos, issues)
- **Gestor de repositorios**: lista, busca, filtra por lenguaje, fija favoritos, crea nuevos
- **Detalles de repo**: issues y pull requests por repositorio
- **Estrellas, Proyectos, Paquetes**: acceso a GitHub Stars, Projects v2 y GitHub Packages
- **Multi-contexto**: cambia entre tu cuenta personal y tus organizaciones sin salir de la app
- **Privacidad**: todos tus datos y credenciales viven en tu servidor

## Self-Hosted

MaurelDev está diseñado para ejecutarse en tu propia infraestructura. No es un SaaS — desplegas una instancia, das acceso al equipo que necesite, y listo.

**Live demo** (si está disponible): `https://dev.webkode.cl`

## Estado del Proyecto

**MVP completado** (mayo 2026): todas las funcionalidades core funcionan. Mejoras post-MVP en curso (filtros avanzados, rediseño UI, comentarios en issues/PRs).

## Próximos Pasos

Para desarrolladores:
- **Detalles técnicos**: ver [docs/project-overview-pdr.md](./docs/project-overview-pdr.md)
- **Guía de deploy**: [docs/deployment-guide.md](./docs/deployment-guide.md)
- **Estructura de código**: [docs/codebase-summary.md](./docs/codebase-summary.md)
- **Arquitectura del sistema**: [docs/system-architecture.md](./docs/system-architecture.md)

## Licencia

Privado. Solo para self-hosting — no es SaaS.
