# VERIA — reporte de pruebas, correcciones e incidencias

Fecha de ejecución: 24 de julio de 2026.

Alcance: calidad local previa al despliegue. No se generó APK/AAB, no se publicó
en EAS y no se realizó ningún despliegue.

## Resultado general

| Comprobación                 | Resultado                                  |
| ---------------------------- | ------------------------------------------ |
| Pruebas de aplicación        | 35/35 aprobadas                            |
| Pruebas del backend de IA    | 12/12 aprobadas                            |
| Pruebas de autenticación     | 9/9 aprobadas                              |
| Total automatizado           | 56/56 aprobadas                            |
| ESLint                       | Aprobado, 0 errores y 0 advertencias       |
| Prettier                     | Aprobado                                   |
| Compatibilidad Expo SDK 56   | Dependencias actualizadas                  |
| Bundle Android local         | Generado correctamente                     |
| Integración Whisper + Ollama | Aprobada con audio sintético               |
| Auditoría backend IA         | 0 vulnerabilidades                         |
| Auditoría raíz               | 0 altas/críticas; 10 moderadas transitivas |
| Despliegue                   | Fuera del alcance                          |

## Pruebas implementadas

### Aplicación móvil: Jest + `jest-expo`

Archivos:

- `tests/cameraUtils.test.js`
- `tests/validation.test.js`
- `tests/ollamaService.test.js`
- `tests/authService.test.js`

Cobertura funcional:

- análisis y selección segura de resoluciones;
- entradas inválidas de cámara;
- correos válidos e inválidos;
- política de contraseña;
- petición de análisis de imagen;
- petición de voz;
- respuesta vacía o HTTP incorrecta;
- cancelación mediante `AbortController`;
- login y registro;
- errores JSON, HTTP y de red.

Resultado: 35 pruebas aprobadas.

### Backend de IA: `node:test`

Archivo:

- `backend/tests/app.test.js`

Cobertura funcional:

- endpoint de salud;
- ocultamiento de `X-Powered-By`;
- validación de imagen;
- respuesta correcta de Ollama;
- errores de Ollama como `502`;
- validación de audio e imagen;
- rechazo de transcripción vacía;
- envío de transcripción al prompt;
- errores de Whisper como `502`;
- JSON inválido como `400`;
- payload enviado a Ollama;
- formulario M4A enviado a Whisper;
- límite determinista de 25 palabras.

Resultado: 12 pruebas aprobadas.

### Autenticación: `node:test`

Archivo:

- `dbconfig/tests/controller.test.js`

Cobertura funcional:

- eliminación de campos de contraseña;
- campos obligatorios;
- correo inválido;
- usuario inexistente;
- contraseña incorrecta;
- login correcto sin hash;
- contraseña débil;
- correo duplicado;
- hash e inserción;
- error controlado de MySQL.

Resultado: 9 pruebas aprobadas.

## Prueba de integración real

Se iniciaron:

- whisper.cpp en `127.0.0.1:8080`;
- backend de IA en `127.0.0.1:3000`;
- Ollama en `127.0.0.1:11434`.

Se generó audio sintético con la frase:

```text
busca mis llaves
```

Se envió junto con `assets/ICON_CAMERA.png` a `/analyze-voice`.

Resultado final:

- Whisper transcribió: `Busca mis llaves.`
- Ollama respondió en español.
- El backend limitó la salida exactamente a 25 palabras.
- Los tres servicios respondieron.

Esta prueba valida el recorrido HTTP completo. No sustituye una prueba con la
cámara y el micrófono reales del teléfono.

## Errores encontrados y corregidos

### 1. ESLint no podía arrancar

Error inicial:

```text
A config object is using the "extends" key, which is not supported
in flat config system.
```

Causa: `eslint.config.js` utilizaba formato antiguo con ESLint 9.

Corrección:

- configuración plana con `eslint-config-expo/flat`;
- integración plana de Prettier;
- globals separados para Node y Jest;
- eliminación de imports sin usar.

Estado: corregido.

### 2. No existía ninguna prueba

Error inicial del backend:

```text
Error: no test specified
```

Corrección:

- Jest para módulos de Expo;
- `node:test` para APIs y autenticación;
- script `npm run test:all`.

Estado: corregido con 56 pruebas.

### 3. Dependencias fuera de la matriz Expo 56

Se detectaron seis paquetes incompatibles o desactualizados, incluidos Expo,
expo-audio, expo-constants y react-native-screens.

Corrección:

- actualización mediante `expo install --fix`;
- validación posterior con `expo install --check`.

Estado: corregido.

### 4. El login devolvía el hash de contraseña

El controlador respondía con `usuario[0]`, que incluía `Contrasena`.

Corrección:

- función `publicUser`;
- eliminación de `Contrasena`, `password` y variantes antes de responder;
- prueba automática para impedir regresión.

Estado: corregido.

### 5. Contraseñas registradas en consola

El backend imprimía `req.body` durante login y registro.

Corrección:

- eliminación de logs del cuerpo;
- errores de base de datos ahora registran solamente el mensaje técnico.

Estado: corregido.

### 6. Validación solo en el teléfono

El registro dependía de validaciones móviles; una llamada directa podía enviar
correo inválido o contraseña débil.

Corrección:

- validación equivalente dentro del controlador del servidor;
- pruebas de rechazo antes de consultar MySQL.

Estado: corregido.

### 7. Backend dependía accidentalmente del `node_modules` raíz

Al eliminar Axios móvil apareció:

```text
Cannot find module 'axios'
```

Aunque `backend/package.json` declaraba Axios, las dependencias locales no
estaban instaladas y el servidor funcionaba por hoisting accidental.

Corrección:

- instalación de dependencias dentro de `backend`;
- backend aislado con auditoría propia;
- Axios eliminado de la aplicación móvil.

Estado: corregido.

### 8. Una transcripción de espacios se aceptaba como válida

La primera ejecución de pruebas encontró:

```text
Expected 422, received 200
```

Corrección:

- normalización con `trim()` en la frontera de `/analyze-voice`;
- prueba específica.

Estado: corregido.

### 9. Ollama ignoraba el máximo de 25 palabras

La primera integración real devolvió más de 25 palabras y mezcló inglés.

Corrección:

- mensaje de sistema que exige español y prohíbe presentaciones;
- normalización de espacios;
- límite determinista de 25 palabras;
- prueba unitaria y repetición de integración real.

Estado: corregido para idioma del prompt y longitud. La calidad semántica sigue
dependiendo del modelo y de la imagen.

### 10. Petición de voz sin timeout

La petición de imagen tenía límite de cinco minutos, pero la de voz no.

Corrección:

- controlador y cleanup compartidos;
- timeout aplicado a ambos flujos.

Estado: corregido.

### 11. Micrófono podía quedar activo al abandonar la pantalla

El cleanup cancelaba HTTP y voz sintetizada, pero no detenía explícitamente una
grabación activa.

Corrección:

- invalidación de pulsación;
- detención del grabador;
- desactivación del modo de grabación;
- manejo de promesas rechazadas de orientación.

Estado: corregido por código; falta confirmar en dispositivo físico.

### 12. URLs de autenticación repetidas dentro de pantallas

Login y registro tenían una IP fija y usaban Axios directamente.

Corrección:

- `config/auth.js`;
- `services/auth.js`;
- `EXPO_PUBLIC_AUTH_URL`;
- `expo/fetch`;
- timeout y errores controlados.

Estado: corregido.

### 13. Errores del backend poco precisos

Whisper/Ollama devolvían `500` genérico y Express podía contestar HTML para JSON
inválido.

Corrección:

- `502` para dependencias de IA;
- `400` JSON controlado;
- `413` con límite explicado;
- Express sin `X-Powered-By`.

Estado: corregido.

### 14. Vulnerabilidades altas de npm

Línea base:

- 14 vulnerabilidades;
- 4 altas;
- 10 moderadas.

Después de actualizar Expo y ejecutar `npm audit fix` sin `--force`:

- 0 altas;
- 0 críticas;
- 10 moderadas transitivas;
- backend de IA: 0 vulnerabilidades.

No se usó `npm audit fix --force` porque propone instalar Expo 46, incompatible
con el proyecto Expo 56.

## Incidencias pendientes

### Seguridad y autenticación

- No existe JWT ni sesión persistente.
- Logout solo navega; no revoca credenciales.
- CORS continúa abierto.
- El tráfico del teléfono usa HTTP local sin TLS.
- No existen roles ni autorización de endpoints.

### Dispositivo

- Falta una prueba E2E en Android/iOS real.
- Falta verificar permisos de cámara y micrófono desde una instalación limpia.
- Falta comprobar interrupciones: llamada, cambio de aplicación, bloqueo y
  desconexión Bluetooth.
- Falta probar el audio M4A producido exactamente por el teléfono. FFmpeg no
  está disponible en el `PATH` del equipo, aunque el servidor procesó el audio
  WAV de integración.

### IA y rendimiento

- Whisper usa CPU; no detectó GPU.
- No se midieron latencia, memoria ni temperatura.
- Audio e imagen viajan como Base64 y tienen límite conjunto de 12 MB.
- No hay duración máxima de grabación.
- La calidad de la respuesta depende de `minicpm-v:latest`.
- El límite de 25 palabras es garantizado, pero un corte puede terminar una
  frase de forma abrupta.

### Base de datos

- No hay migraciones ni esquema SQL versionado.
- Las pruebas usan mocks; no se ejecutó integración contra MySQL real.
- Falta probar concurrencia y duplicados simultáneos.
- La sesión y recuperación de contraseña no están implementadas.

### Cobertura

- No se probaron visualmente las pantallas.
- No hay pruebas de navegación.
- No hay pruebas automáticas de TalkBack/VoiceOver.
- Los ajustes todavía no se persisten ni modifican CameraScreen.

### Repositorio

- La carpeta `.git` está vacía o incompleta y Git no reconoce el proyecto como
  repositorio. No fue posible obtener un diff confiable con `git status`.
- `.quality-build` contiene el bundle local de validación y está ignorado. No es
  un despliegue ni un artefacto de publicación.

## Comandos de calidad

Ejecutar todo:

```powershell
cd C:\capstone
npm.cmd run test:all
npm.cmd run lint
npm.cmd run format:check
npx.cmd expo install --check
```

Validar bundle Android sin desplegar:

```powershell
$env:CI="1"
npx.cmd expo export --platform android --output-dir .quality-build
```

Auditorías:

```powershell
npm.cmd audit --omit=dev
npm.cmd audit --prefix backend
```

## Criterio de salida de esta fase

La fase local se considera cumplida porque:

- todas las pruebas automatizadas pasan;
- lint y formato pasan;
- Expo confirma compatibilidad;
- Android puede generar el bundle;
- Whisper y Ollama funcionaron en integración local;
- no quedan vulnerabilidades altas o críticas conocidas;
- las limitaciones pendientes están documentadas;
- no se realizó despliegue.
