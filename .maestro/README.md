# Flujos móviles de VerIA

Esta carpeta contiene especificaciones de interfaz para Maestro. Los flujos usan
`testID` en lugar de coordenadas, por lo que resisten cambios de tamaño,
orientación y traducción mejor que una secuencia basada en posiciones.

## Estado actual

- Los archivos YAML se analizan automáticamente desde Jest.
- El contrato comprueba que cada selector `id` exista en el código React Native.
- La ejecución sobre Android requiere una sesión de Expo Go accesible desde el
  dispositivo, Java 17, Android Platform Tools y Maestro CLI.
- `04_voice_hold_contract.yaml` requiere además cámara, micrófono y los servicios
  locales activos. Es una prueba de sistema y no forma parte de la batería Jest.

## Variables

- `APP_URL`: enlace `exp://` que muestra Metro al iniciar el proyecto.
- `E2E_EMAIL`: correo de una cuenta de prueba sin privilegios.
- `E2E_PASSWORD`: contraseña de esa cuenta.

No guardes credenciales reales en estos archivos.

## Ejemplos de ejecución

Validaciones sin autenticación:

```powershell
maestro test -e APP_URL=exp://DIRECCION:8081 .maestro/01_login_validation.yaml
maestro test -e APP_URL=exp://DIRECCION:8081 .maestro/02_registration_validation.yaml
```

Navegación autenticada:

```powershell
maestro test `
  -e APP_URL=exp://DIRECCION:8081 `
  -e E2E_EMAIL=cuenta_de_prueba `
  -e E2E_PASSWORD=secreto_de_prueba `
  .maestro/03_authenticated_navigation.yaml
```

Validación estática del contrato:

```powershell
npm run test:maestro-contract
```
