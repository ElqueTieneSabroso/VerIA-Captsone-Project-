# VERIA

## Dossier técnico, registro de cambios y evidencia de calidad

**Corte documental:** 24 de julio de 2026  
**Versión del dossier:** 1.0  
**Estado del sistema documentado:** desarrollo local verificado  
**Propósito:** conservar la verdad técnica del proyecto, registrar pruebas e
incidencias y servir como fuente para redactar posteriormente un documento
académico o profesional de aproximadamente 200 páginas.

---

## 1. Control del documento

| Campo                                  | Valor                                          |
| -------------------------------------- | ---------------------------------------------- |
| Proyecto                               | VERIA, asistente visual móvil                  |
| Repositorio de trabajo                 | `C:\capstone`                                  |
| Aplicación cliente                     | Expo SDK 56, React Native 0.85.3, React 19.2.3 |
| API de visión y voz                    | Node.js, Express 5, Multer, FFmpeg             |
| Transcripción                          | whisper.cpp con modelo `ggml-small.bin`        |
| Modelo visual                          | Ollama con `minicpm-v:latest`                  |
| Autenticación                          | Node.js, Express, bcrypt y MySQL               |
| Base de datos verificada               | MySQL 9.4.0; 7 tablas detectadas               |
| Pruebas automatizadas ejecutadas       | 68 aprobadas, 0 fallidas en el corte final     |
| Automatización móvil preparada         | 4 flujos Maestro; contrato YAML validado       |
| Incidencia funcional abierta principal | Posible alucinación del modelo visual          |

### 1.1 Convenciones de estado

- **EJECUTADA — APROBADA:** existe una ejecución reproducible con resultado
  favorable.
- **EJECUTADA — FALLIDA:** la ejecución produjo un resultado contrario al
  esperado. Debe conservarse como evidencia.
- **CORREGIDA Y REVALIDADA:** existió un fallo, se modificó el sistema y una
  ejecución posterior comprobó la corrección.
- **VALIDADA ESTÁTICAMENTE:** la especificación es sintácticamente válida y sus
  referencias existen, pero no se ejecutó sobre un dispositivo.
- **PENDIENTE:** todavía falta el entorno o la evidencia necesaria.
- **INCIDENCIA ABIERTA:** problema confirmado que requiere trabajo posterior.

### 1.2 Reglas de uso de este dossier

1. No convertir una prueba estática en una prueba ejecutada.
2. No presentar la respuesta de un modelo generativo como verdad visual sin una
   referencia de control.
3. No copiar credenciales, cadenas de conexión ni datos personales.
4. Conservar los errores iniciales junto con su corrección.
5. Cuando una cifra no provenga de una medición, marcarla como estimación.
6. Mantener cada requisito enlazado con código, prueba y evidencia.

---

## 2. Resumen ejecutivo

VERIA es una aplicación móvil orientada a personas con baja visión. Su flujo
principal captura una escena con la cámara, envía la imagen a un modelo visual y
lee una descripción breve en voz alta. El sistema incorpora además una
interacción por pulsación sostenida: el usuario mantiene presionado el icono de
micrófono, dicta una instrucción —por ejemplo, “Busca mis llaves”— y al soltar el
botón finaliza la grabación. El audio se envía al backend, se normaliza con
FFmpeg, se transcribe con whisper.cpp y la transcripción se combina con la
imagen para consultar a Ollama.

El cambio más importante del periodo fue sustituir el transporte de audio
basado en lectura del archivo y construcción manual de `FormData` por la carga
nativa de `expo-file-system`. Esta decisión corrigió dos fallos observados en
Android: la imposibilidad de leer la grabación y el error
`unsupported form data part implementation`. El backend recibe ahora el M4A
como un archivo multipart mediante Multer y lo convierte por tubería a WAV PCM
mono de 16 kHz, formato aceptado de forma consistente por whisper.cpp.

La interfaz de cámara quedó con dos controles principales grandes, sin fondo ni
margen visual adicional: icono de cámara en el lado izquierdo e icono
`assets/ICON_MICROPHONE.png` en el lado derecho. Ambos controles miden 116 por
96 puntos y muestran iconos de 108 por 84. El micrófono responde a
`onPressIn` y `onPressOut`; no funciona como un toque convencional.

La batería final ejecutada contiene 43 pruebas Jest del cliente y contratos
Maestro, 16 pruebas del backend y 9 pruebas del controlador de autenticación:
68 pruebas aprobadas. También se aprobaron lint, formato, 21 comprobaciones de
`expo-doctor`, una conexión de solo lectura a la base de datos y una integración
real de audio, Whisper y Ollama.

La prueba integral confirmó una transcripción exacta y una respuesta HTTP 200
en 3.811 segundos. No obstante, la imagen de control no contenía llaves y el
modelo afirmó que estaban en una mesa. Por ello, el transporte, la conversión y
la transcripción se consideran aprobados, mientras que la fidelidad semántica
de la respuesta visual permanece como incidencia abierta de alta prioridad.

---

## 3. Alcance de esta versión documental

Este dossier incluye únicamente el estado del código y la calidad comprobada
hasta el corte indicado:

- arquitectura del cliente, backend, transcripción, modelo visual,
  autenticación y base de datos;
- explicación de módulos y flujos principales;
- cambios realizados para cámara, audio, interfaz y manejo de errores;
- pruebas unitarias, de contrato, integración y verificaciones estáticas;
- especificaciones Maestro preparadas;
- incidencias encontradas, correcciones aplicadas y riesgos todavía abiertos;
- matriz de trazabilidad;
- instrucciones reproducibles;
- esquema editorial y prompt para ampliar el material a unas 200 páginas.

Las pruebas E2E y UAT sobre dispositivo se conservan como pendientes. El motivo
es estrictamente verificable: en el equipo de evaluación no se encontraron
Android Platform Tools, un dispositivo conectado ni Maestro CLI. El dossier no
atribuye resultados a esas pruebas.

---

## 4. Problema, usuarios y objetivo funcional

### 4.1 Problema atendido

Una persona con baja visión puede necesitar información rápida sobre objetos,
obstáculos o posiciones relativas en una escena. La aplicación busca reducir la
carga de interacción mediante controles grandes, retroalimentación háptica,
mensajes accesibles y lectura por voz.

### 4.2 Usuario principal

El usuario objetivo es una persona que:

- puede tener dificultad para distinguir controles pequeños;
- se beneficia de instrucciones auditivas breves;
- necesita cancelar o repetir una descripción sin navegar por menús complejos;
- puede formular una búsqueda concreta por voz;
- requiere respuestas prudentes, directas y sin contenido inventado.

### 4.3 Objetivos funcionales actuales

| ID    | Objetivo                                                                 |
| ----- | ------------------------------------------------------------------------ |
| RF-01 | Capturar una imagen desde la cámara tras conceder permiso.               |
| RF-02 | Enviar la imagen a un servicio visual y obtener una descripción breve.   |
| RF-03 | Leer la descripción mediante síntesis de voz en español.                 |
| RF-04 | Iniciar una grabación al presionar el micrófono y detenerla al soltarlo. |
| RF-05 | Transcribir el audio y combinar la instrucción con la imagen actual.     |
| RF-06 | Permitir registro e inicio de sesión con validaciones controladas.       |
| RF-07 | Ofrecer pantallas de accesibilidad, interfaz y retroalimentación.        |
| RF-08 | Permitir cancelar o repetir una descripción desde el control de cámara.  |

### 4.4 Objetivos de calidad

| ID     | Objetivo                                                                       |
| ------ | ------------------------------------------------------------------------------ |
| RNF-01 | Los controles críticos deben ser identificables por tecnologías de asistencia. |
| RNF-02 | Las solicitudes deben poder cancelarse y tener tiempo límite.                  |
| RNF-03 | El backend no debe exponer detalles internos innecesarios.                     |
| RNF-04 | Los archivos y cuerpos deben tener límites explícitos.                         |
| RNF-05 | Las respuestas visuales deben ser breves, en español y conservadoras.          |
| RNF-06 | Las credenciales no deben guardarse en archivos versionables.                  |
| RNF-07 | Las pruebas deben ser repetibles y distinguir simulación de integración real.  |

---

## 5. Arquitectura actual

### 5.1 Vista lógica

El sistema se compone de seis bloques:

1. **Cliente móvil Expo/React Native.** Presenta autenticación, cámara,
   controles accesibles, grabación de audio, estados y síntesis de voz.
2. **Servicio de autenticación.** Expone registro e inicio de sesión, valida
   entrada, consulta MySQL y usa bcrypt para las contraseñas.
3. **Backend de visión y voz.** Recibe imágenes Base64 y archivos de audio,
   controla tamaños, coordina FFmpeg, Whisper y Ollama y normaliza respuestas.
4. **FFmpeg.** Transforma el audio del dispositivo a WAV PCM mono de 16 kHz y
   limita la duración procesada a 30 segundos.
5. **whisper.cpp.** Ejecuta localmente el modelo `ggml-small.bin` y devuelve la
   transcripción en español.
6. **Ollama.** Ejecuta un modelo con capacidad visual y responde a la
   descripción o instrucción contextual.

### 5.2 Flujo de captura visual

1. `CameraScreen` espera `onCameraReady`.
2. El usuario activa `camera-capture-button`.
3. `takePictureAsync` captura Base64 con calidad 0.25.
4. `analyzeImageWithBackend` envía JSON a `POST /analyze`.
5. El backend construye un mensaje de sistema y un mensaje con imagen.
6. Ollama devuelve texto.
7. El backend normaliza espacios y limita la salida a 25 palabras.
8. El cliente anuncia el estado, vibra y reproduce el resultado con
   `expo-speech`.

### 5.3 Flujo de instrucción por voz

1. `onPressIn` llama `startVoiceCommand`.
2. Se solicita permiso de micrófono.
3. Se configura la sesión de audio y se prepara
   `RecordingPresets.HIGH_QUALITY` con directorio `document`.
4. Se inicia la grabación y se anuncia “Escuchando”.
5. `onPressOut` llama `finishVoiceCommand`.
6. Se detiene el grabador y `resolveCompletedRecordingUri` obtiene primero
   `status.url` o, como respaldo, `audioRecorder.uri`.
7. La cámara captura una imagen de contexto.
8. `File.upload` envía el archivo M4A directamente como multipart junto con
   `imageBase64`.
9. Multer recibe el audio en memoria con límite de 12 MB.
10. FFmpeg recibe el audio por `stdin` y produce WAV por `stdout`; no se crea un
    archivo intermedio.
11. Whisper transcribe el WAV con idioma español.
12. El backend envía transcripción e imagen a Ollama.
13. El cliente anuncia la instrucción y lee el resultado.

### 5.4 Contratos HTTP

#### `GET /`

Respuesta esperada:

```json
{
  "message": "Veria backend running"
}
```

#### `POST /analyze`

Entrada JSON:

```json
{
  "imageBase64": "<imagen codificada>"
}
```

Salida satisfactoria:

```json
{
  "result": "<descripcion breve>"
}
```

Errores controlados principales: 400 por imagen faltante, 413 por cuerpo
demasiado grande y 502 por indisponibilidad del modelo.

#### `POST /analyze-voice`

Entrada multipart:

- `audio`: archivo `audio/mp4`;
- `imageBase64`: texto con la imagen de contexto.

Salida satisfactoria:

```json
{
  "transcription": "Busca mis llaves.",
  "result": "<respuesta visual breve>"
}
```

Errores controlados principales: 400 por formulario incompleto, 413 por límite
de 12 MB, 415 por archivo que no sea audio, 422 por transcripción vacía y 502
por fallo de transcripción o análisis.

#### Autenticación

- `POST /api/auth/login`
- `POST /api/auth/register`

Los controladores usan consultas parametrizadas, validan el correo, verifican
la política de contraseña y nunca devuelven campos comunes de contraseña.

---

## 6. Inventario de módulos importantes

### 6.1 Entrada y navegación

| Archivo                        | Responsabilidad                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `index.js`                     | Registra el componente raíz de Expo.                                                    |
| `app/App.js`                   | Instala `SafeAreaProvider` y carga el navegador.                                        |
| `navigator/Application_nav.js` | Define Welcome, Login, Register, Camera, Settings, Accessibility, Interface y Feedback. |

La ruta inicial es `Welcome`. Después de siete segundos reemplaza la pantalla
por `Login`. Un inicio de sesión válido reemplaza la ruta por `Camera`.

### 6.2 Pantallas

#### `screens/Welcome.jsx`

Muestra el logotipo, nombre, propósito y estado de carga. Se añadió
`welcome-screen` y una etiqueta accesible para el logotipo.

#### `screens/Login.jsx`

Gestiona correo y contraseña, valida campos vacíos y formato de correo, invoca
`services/auth.js` y navega a cámara. Sus identificadores principales son:

- `login-screen`;
- `login-email-input`;
- `login-password-input`;
- `login-submit-button`;
- `login-register-link`;
- `login-back-link`.

#### `screens/SignIn.jsx`

Gestiona nombre, correo, contraseña y confirmación. Aplica la política de ocho
caracteres, mayúscula, minúscula, número y carácter especial. Sus
identificadores comienzan con `register-`.

#### `screens/CameraScreen.jsx`

Es el módulo de mayor complejidad. Coordina:

- permisos de cámara y micrófono;
- preparación y estado de cámara;
- selección de resolución;
- captura Base64;
- cancelación con `AbortController`;
- pulsación sencilla, doble y repetición;
- grabación por pulsación sostenida;
- vibración;
- anuncios de accesibilidad;
- síntesis de voz;
- navegación a ajustes;
- limpieza al desmontar.

Estados principales:

| Estado             | Significado                                    |
| ------------------ | ---------------------------------------------- |
| `cameraReady`      | La cámara informó que está lista.              |
| `pictureSize`      | Resolución seleccionada por `pickPictureSize`. |
| `capturedPhotoUri` | Vista congelada mientras se procesa.           |
| `isProcessing`     | Existe una operación activa.                   |
| `statusMessage`    | Mensaje visual y accesible.                    |
| `lastDescription`  | Última respuesta disponible para repetir.      |
| `hasError`         | Cambia el panel a estilo de error.             |
| `isVoiceRecording` | Mantiene el estado visual del micrófono.       |

Referencias mutables:

| Referencia          | Uso                                                       |
| ------------------- | --------------------------------------------------------- |
| `cameraRef`         | Acceso a `CameraView`.                                    |
| `voicePressHeldRef` | Evita iniciar si el usuario soltó durante la preparación. |
| `voiceRecordingRef` | Evita inicios o cierres duplicados.                       |
| `activeRequestRef`  | Permite abortar la solicitud vigente.                     |
| `captureRunRef`     | Invalida resultados antiguos.                             |
| `pressTimerRef`     | Distingue pulsación sencilla de doble pulsación.          |

#### Ajustes

`Settings.jsx`, `Accessibility.jsx`, `Interface.jsx` y `feedback.jsx` contienen
controles locales. Los interruptores y botones ya tienen `testID` y etiquetas
accesibles. Actualmente esas preferencias viven únicamente en el estado de
cada pantalla; no se persisten ni modifican globalmente la experiencia de
cámara. Esta limitación se registra como deuda funcional.

### 6.3 Servicios del cliente

#### `services/ollama.js`

Aunque el nombre alude a Ollama, este archivo es el cliente del backend:

- impone un tiempo máximo de 300 segundos;
- propaga cancelación externa;
- envía imágenes con `expo/fetch`;
- carga el archivo de audio con `expo-file-system/File.upload`;
- analiza la respuesta JSON;
- transforma abortos en mensajes comprensibles.

La carga nativa es la corrección decisiva para Android. El código no lee el
archivo de audio como texto o Base64 y no construye manualmente una parte
`FormData` con una URI.

#### `services/auth.js`

Centraliza solicitudes de registro e inicio de sesión. Usa un límite de 15
segundos y diferencia errores controlados del servidor, abortos y fallos de
red.

### 6.4 Utilidades

| Archivo               | Función                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `utils/audio.js`      | Resuelve de forma segura la URI final de grabación.                        |
| `utils/camera.js`     | Analiza tamaños y selecciona el mayor que no exceda 720 px por lado mayor. |
| `utils/validation.js` | Contiene expresiones regulares compartidas para correo y contraseña.       |

### 6.5 Backend de visión y voz

#### `backend/app.js`

Contiene fábrica de aplicación, fábrica de cliente de IA y funciones puras
probables. Controles relevantes:

- `express.json({ limit: "12mb" })`;
- Multer con un solo archivo y límite de 12 MB;
- desactivación de `x-powered-by`;
- cancelación si el cliente cierra la respuesta;
- errores 400, 413, 415, 422 y 502;
- límite de 30 segundos en FFmpeg;
- salida WAV mono, 16 kHz, PCM de 16 bits;
- límite final de 25 palabras;
- sustitución de respuestas de rechazo por una guía visual segura.

#### `backend/index.js`

Inicia la aplicación en `0.0.0.0:3000` salvo que variables de entorno indiquen
otros valores.

### 6.6 Autenticación y base de datos

| Archivo                  | Responsabilidad                                                                  |
| ------------------------ | -------------------------------------------------------------------------------- |
| `dbconfig/db.js`         | Crea el pool MySQL mediante variables de entorno.                                |
| `dbconfig/controller.js` | Valida, consulta, compara o genera hash y elimina contraseñas de las respuestas. |
| `dbconfig/auth.js`       | Define las rutas de autenticación.                                               |
| `dbconfig/server.js`     | Inicia el servicio en el puerto 3001.                                            |
| `dbconfig/.env.example`  | Documenta variables requeridas sin valores sensibles.                            |

### 6.7 Automatización

| Recurso                             | Función                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `tests/*.test.js`                   | Pruebas Jest del cliente y contrato Maestro.           |
| `backend/tests/app.test.js`         | Pruebas Node del backend.                              |
| `dbconfig/tests/controller.test.js` | Pruebas Node del controlador de autenticación.         |
| `.maestro/*.yaml`                   | Especificaciones de interacción móvil.                 |
| `scripts/verifyVoicePipeline.js`    | Comprobación real de audio, Whisper y Ollama.          |
| `scripts/verifyDatabase.js`         | Comprobación de conectividad y metadatos no sensibles. |

---

## 7. Cambios realizados

### 7.1 Interacción de voz por pulsación sostenida

Se implementó el ciclo completo:

```text
presionar -> solicitar permiso -> preparar -> grabar
soltar -> detener -> resolver URI -> capturar imagen -> cargar -> transcribir
-> consultar modelo visual -> anunciar y leer
```

La bandera `voicePressHeldRef` resuelve una carrera importante: el usuario
puede soltar el botón mientras Android todavía muestra el permiso o prepara el
grabador. En ese caso no se inicia una grabación tardía.

### 7.2 Persistencia temporal de la grabación

El preset de grabación se extendió con `directory: "document"`. La referencia de
Expo SDK 56 indica que la carpeta de caché puede limpiarse cuando falta espacio
y que el directorio de documentos es más persistente. Esto reduce la
probabilidad de que la URI desaparezca antes de la carga.

### 7.3 Resolución robusta de la URI

`resolveCompletedRecordingUri` prioriza la URL entregada por el estado del
grabador y utiliza `audioRecorder.uri` como respaldo. Si ninguna existe, genera
un error explícito. Hay tres pruebas dedicadas a este comportamiento.

### 7.4 Carga nativa del archivo

Se eliminó el enfoque que intentaba leer la grabación desde JavaScript y
transformarla a Base64. La versión actual crea `new File(audioUri)` y llama
`upload` con:

- método POST;
- tipo multipart;
- campo `audio`;
- MIME `audio/mp4`;
- imagen Base64 como parámetro;
- señal de cancelación.

### 7.5 Recepción multipart

El backend usa Multer con memoria acotada. Valida que el MIME empiece con
`audio/`, limita un archivo y controla tamaños. Se mantiene compatibilidad con
`audioBase64` en solicitudes JSON para no romper consumidores anteriores.

### 7.6 Conversión FFmpeg

whisper.cpp rechazó el M4A directo durante una prueba real. Se agregó una
normalización por tuberías:

```text
entrada M4A -> FFmpeg stdin -> WAV PCM s16le, mono, 16000 Hz -> stdout
```

No se construyen rutas temporales para esta conversión. Se controla el cierre,
los errores de `stdin`, la ausencia de salida y la cancelación.

### 7.7 Iconos y tamaño de controles

La cámara está en el extremo inferior izquierdo y el micrófono en el derecho.
Se usa `assets/ICON_CAMERA.png` y `assets/ICON_MICROPHONE.png`. Los controles no
tienen un contenedor visual con margen; el área táctil es mayor que el dibujo y
conserva accesibilidad.

### 7.8 Cancelación y estados

Cada captura incrementa `captureRunRef`. Si llega una respuesta de una ejecución
anterior, se descarta. `AbortController` cancela transporte y FFmpeg si el
cliente deja de esperar. Al desmontar se detienen grabación, audio, orientación
y voz.

### 7.9 Identificadores para automatización

Se añadieron identificadores estables a pantallas, campos, botones,
interruptores y deslizador. Maestro puede operar sobre el árbol de accesibilidad
sin depender de coordenadas. La prueba de contrato comprueba que cada `id`
referenciado en YAML exista como `testID` en el código.

### 7.10 Compatibilidad de Expo SDK 56

La primera revisión de `expo-doctor` detectó:

1. una propiedad Android no permitida por el esquema;
2. `expo-asset` como peer faltante de `expo-audio`;
3. duplicados de `expo-asset` y `expo-constants`.

Se retiró la propiedad fuera de esquema y se instaló `expo-asset@56.0.21` con
`npx expo install`. La revalidación final aprobó 21 de 21 comprobaciones.

### 7.11 Dependencias y seguridad

Multer 2.0.2 reportó una vulnerabilidad alta de denegación de servicio. La
actualización segura dejó `multer@2.2.0` y la auditoría final del backend reportó
cero vulnerabilidades.

Se agregó `dbconfig/.env` a `.gitignore` y se creó
`dbconfig/.env.example`. Los valores reales no forman parte de este dossier.

### 7.12 Normalización de respuestas del modelo

La primera integración devolvió una disculpa y una explicación de incapacidad.
Se reforzó el mensaje de sistema y se agregó una detección de frases de rechazo.
Cuando aparece ese patrón, el backend devuelve una instrucción conservadora
para mover la cámara.

Esta corrección no soluciona por sí sola la alucinación de objetos. Ese riesgo
permanece abierto y requiere un mecanismo de evaluación visual con imágenes de
control.

---

## 8. Registro de incidencias y correcciones

| ID      | Hallazgo                                                     | Causa                                                                                        | Acción                                                                | Estado                            |
| ------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| INC-001 | Error al leer la grabación con FileSystem                    | Lectura de URI nativa como texto y posible desaparición de caché                             | Directorio `document`, URI resuelta y carga nativa                    | Corregida y revalidada            |
| INC-002 | `unsupported form data part implementation`                  | Parte multipart construida con objeto URI no compatible                                      | `File.upload` con `UploadType.MULTIPART`                              | Corregida y revalidada            |
| INC-003 | No aparecía el icono de micrófono                            | Recurso o referencia de activo incorrectos                                                   | Copia y referencia directa a `assets/ICON_MICROPHONE.png`             | Corregida                         |
| INC-004 | Whisper respondió 400 al recibir M4A                         | whisper.cpp esperaba un formato de audio compatible                                          | Conversión FFmpeg a WAV mono de 16 kHz                                | Corregida y revalidada            |
| INC-005 | `expo-doctor` aprobó 18/21                                   | Configuración inválida, peer faltante y duplicados                                           | Ajuste de `app.json` e instalación compatible                         | Corregida; 21/21                  |
| INC-006 | Auditoría alta en Multer 2.0.2                               | Avisos de agotamiento de recursos                                                            | Actualización a Multer 2.2.0                                          | Corregida; 0 en backend           |
| INC-007 | Jest no pudo importar `yaml`                                 | El preset de React Native eligió la exportación ESM de navegador                             | Resolución explícita de la entrada CommonJS                           | Corregida; 4 contratos pasan      |
| INC-008 | Formato final falló por `app.json`                           | Cambio manual sin reformatar                                                                 | Prettier sobre el archivo y nueva revisión                            | Corregida                         |
| INC-009 | Modelo respondió “no puedo”                                  | Incumplimiento del mensaje de sistema                                                        | Prompt reforzado y fallback seguro                                    | Corregida para rechazos conocidos |
| INC-010 | Modelo afirmó que había llaves en una imagen sin llaves      | Alucinación visual o insuficiente anclaje a la imagen                                        | No existe corrección concluyente                                      | Incidencia abierta, alta          |
| INC-011 | Auditoría raíz conserva 42 avisos                            | Cadenas de Expo, React Native, Jest y ESLint; las propuestas fuerzan versiones incompatibles | No se aplicó actualización forzada                                    | Incidencia abierta                |
| INC-012 | Flujos Maestro no ejecutados sobre Android                   | Faltan herramientas de dispositivo y Maestro CLI en el equipo                                | YAML y selectores preparados y validados                              | Pendiente                         |
| INC-013 | Preferencias de ajustes no afectan globalmente la aplicación | Estado local no persistido                                                                   | Requiere diseño de contexto y almacenamiento                          | Incidencia abierta                |
| INC-014 | URL local predeterminada está fija a una dirección privada   | Valores de respaldo en `config/*.js`                                                         | Variables `EXPO_PUBLIC_*` disponibles; falta eliminar respaldo rígido | Incidencia abierta                |
| INC-015 | Archivo de audio en documentos no se elimina al terminar     | Se priorizó evitar pérdida prematura                                                         | Agregar política de limpieza tras carga o error                       | Incidencia abierta                |

### 8.1 Detalle de la incidencia semántica

**Entrada de audio:** grabación M4A generada con la frase “Busca mis llaves”.  
**Imagen de control:** icono de cámara, sin llaves ni mesa.  
**Transcripción:** “Busca mis llaves.”  
**Respuesta final observada:** “Las llaves están en la mesa arriba de tu
silla.”  
**Evaluación:**

- transporte multipart: aprobado;
- conversión FFmpeg: aprobada;
- Whisper: aprobado para esta muestra;
- llamada a Ollama: aprobada técnicamente;
- fidelidad visual: fallida;
- riesgo para usuario: alto, porque una ubicación inventada puede inducir una
  acción incorrecta.

### 8.2 Recomendación para resolver INC-010

Crear un conjunto de imágenes controladas con anotaciones de:

- objeto presente y ubicación;
- objeto ausente;
- objeto parcialmente ocluido;
- baja iluminación;
- múltiples objetos parecidos;
- escena movida;
- imagen sin contenido útil.

Cada respuesta debe evaluarse con reglas binarias:

1. no afirmar presencia cuando la referencia dice ausente;
2. no inventar posición;
3. declarar incertidumbre cuando corresponda;
4. mantener 25 palabras;
5. usar español claro;
6. sugerir movimiento de cámara solo cuando falte evidencia.

---

## 9. Estrategia de pruebas

### 9.1 Capas

| Capa                          | Herramienta                           | Propósito                                             | Estado                                      |
| ----------------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| Funciones puras               | Jest / Node Test                      | Validación, resolución de URI, tamaños, normalización | Ejecutada                                   |
| Servicios cliente             | Jest con dobles                       | Contratos HTTP, carga nativa, cancelación y errores   | Ejecutada                                   |
| Controladores                 | Node Test con dependencias inyectadas | Reglas de autenticación y protección de contraseña    | Ejecutada                                   |
| API backend                   | Node Test con servidor efímero        | Rutas, estados HTTP, multipart y conversión           | Ejecutada                                   |
| Contrato móvil                | Jest + parser YAML                    | Sintaxis Maestro y existencia de `testID`             | Ejecutada                                   |
| Integración de servicios      | Scripts y procesos reales             | Base de datos, Whisper, Ollama y salud HTTP           | Ejecutada                                   |
| Interacción sobre dispositivo | Maestro                               | Gestos, navegación, permisos y árbol accesible        | Validada estáticamente; ejecución pendiente |
| Aceptación de usuario         | Guiones UAT                           | Utilidad real para persona con baja visión            | Pendiente                                   |

### 9.2 Principios aplicados

- Las pruebas unitarias no llaman a servicios externos.
- El backend se crea mediante fábricas para inyectar dobles.
- Las rutas HTTP se prueban con puertos efímeros.
- Las consultas del controlador usan una base simulada.
- La prueba de base de datos real es de lectura.
- La integración de voz conserva latencia, transcripción y respuesta.
- Los resultados semánticos se evalúan por separado de la disponibilidad HTTP.

---

## 10. Resultados consolidados

### 10.1 Resumen final

| Comprobación                        |                         Resultado | Estado             |
| ----------------------------------- | --------------------------------: | ------------------ |
| Jest del cliente y contrato Maestro |                             43/43 | Aprobada           |
| Backend Node Test                   |                             16/16 | Aprobada           |
| Autenticación Node Test             |                               9/9 | Aprobada           |
| Total automatizado                  |                             68/68 | Aprobada           |
| ESLint mediante Expo                |                       sin errores | Aprobada           |
| Prettier                            |      todos los archivos coinciden | Aprobada           |
| `expo-doctor`                       |                             21/21 | Aprobada           |
| Auditoría del backend               |                0 vulnerabilidades | Aprobada           |
| Auditoría raíz                      | 42 avisos; 10 moderados, 32 altos | Incidencia abierta |
| Conexión MySQL                      |       conectada; 7 tablas; 670 ms | Aprobada           |
| Salud backend                       |                          HTTP 200 | Aprobada           |
| Salud autenticación                 |                          HTTP 200 | Aprobada           |
| Salud Whisper                       |                          HTTP 200 | Aprobada           |
| Salud Ollama                        |    HTTP 200 y modelos disponibles | Aprobada           |
| Voz real, transporte                |                 HTTP 200; 3.811 s | Aprobada           |
| Voz real, transcripción             |       frase exacta en una muestra | Aprobada           |
| Voz real, fidelidad visual          |                  objeto inventado | Fallida            |
| Flujos Maestro sobre dispositivo    |                     no ejecutados | Pendiente          |

### 10.2 Tiempos observados

| Medición                   |  Tiempo |
| -------------------------- | ------: |
| Jest, seis suites          | 3.379 s |
| Backend, 16 pruebas        |  606 ms |
| Autenticación, 9 pruebas   |  187 ms |
| Conexión y metadatos MySQL |  670 ms |
| Integración final de voz   | 3.811 s |

Estos números son una observación puntual, no un estudio de rendimiento. No se
calcularon percentiles, desviación estándar ni calentamiento del modelo.

### 10.3 Validación negativa del servicio de autenticación

| Caso                          | Estado HTTP | Respuesta                         |
| ----------------------------- | ----------: | --------------------------------- |
| Inicio sin campos             |         400 | Todos los campos son obligatorios |
| Correo inválido               |         400 | Correo inválido                   |
| Registro con contraseña débil |         400 | Contraseña insegura               |

No se insertaron usuarios durante estas comprobaciones.

---

## 11. Catálogo de pruebas del cliente

### 11.1 Validación de formularios — 15 pruebas

| Grupo               | Casos                                                                   | Resultado   |
| ------------------- | ----------------------------------------------------------------------- | ----------- |
| Correos válidos     | correo común, alias y espacios exteriores                               | 3 aprobados |
| Correos inválidos   | indefinido, vacío, sin dominio y formatos incompletos                   | 5 aprobados |
| Contraseña fuerte   | `Password1!`                                                            | 1 aprobado  |
| Contraseñas débiles | ausente, corta, sin mayúscula, sin minúscula, sin número o sin especial | 6 aprobados |

### 11.2 Utilidades de cámara — 11 pruebas

| Caso                           | Objetivo                                         | Resultado   |
| ------------------------------ | ------------------------------------------------ | ----------- |
| Tamaño válido                  | Convertir `1280x720` a dimensiones               | Aprobado    |
| Siete tamaños inválidos        | Rechazar valores vacíos, texto, cero y negativos | 7 aprobados |
| Mayor tamaño dentro del límite | Elegir `720x720`                                 | Aprobado    |
| Respaldo al menor disponible   | Evitar resultado vacío                           | Aprobado    |
| Entradas ausentes              | Devolver `undefined` con seguridad               | Aprobado    |

### 11.3 Utilidad de grabación — 3 pruebas

1. Prioriza `status.url`.
2. Usa `audioRecorder.uri` si el estado no tiene URL.
3. Rechaza una grabación sin URL completada.

### 11.4 Servicio de autenticación — 4 pruebas

1. Envía credenciales y devuelve datos del servidor.
2. Conserva el mensaje de un error controlado de registro.
3. Maneja una respuesta de error que no sea JSON.
4. Convierte un fallo de red en un mensaje comprensible.

### 11.5 Servicio de visión y voz — 6 pruebas

1. La imagen Base64 se envía y el texto se recorta.
2. Un fallo HTTP de imagen se informa.
3. La carga de voz devuelve transcripción y resultado.
4. Se conserva el mensaje de error del backend.
5. Una cancelación externa se propaga a la carga nativa.
6. Se rechaza la ausencia de URI antes de enviar.

### 11.6 Contrato Maestro — 4 pruebas

1. Todos los flujos contienen dos documentos YAML válidos: configuración y
   comandos.
2. Todos abren una URL de desarrollo parametrizada.
3. Cada selector `id` existe como `testID`.
4. Ningún flujo depende de coordenadas.

---

## 12. Catálogo de pruebas del backend

| ID    | Prueba                                  | Cobertura            | Estado   |
| ----- | --------------------------------------- | -------------------- | -------- |
| BE-01 | Salud sin encabezado de Express         | privacidad básica    | Aprobada |
| BE-02 | Imagen faltante                         | 400 controlado       | Aprobada |
| BE-03 | Resultado de Ollama                     | ruta satisfactoria   | Aprobada |
| BE-04 | Fallo de Ollama                         | mapeo a 502          | Aprobada |
| BE-05 | Audio o imagen faltante                 | 400 controlado       | Aprobada |
| BE-06 | Transcripción vacía                     | 422 controlado       | Aprobada |
| BE-07 | Transcripción e imagen pasan al modelo  | integración interna  | Aprobada |
| BE-08 | Archivo M4A multipart                   | recepción sin Base64 | Aprobada |
| BE-09 | Archivo que no es audio                 | 415 controlado       | Aprobada |
| BE-10 | Fallo de Whisper                        | mapeo a 502          | Aprobada |
| BE-11 | JSON inválido                           | 400 controlado       | Aprobada |
| BE-12 | Modelo y mensajes enviados a Ollama     | contrato de cliente  | Aprobada |
| BE-13 | WAV enviado a Whisper y texto recortado | contrato de cliente  | Aprobada |
| BE-14 | Conversión FFmpeg                       | formato de salida    | Aprobada |
| BE-15 | Normalización y límite de 25 palabras   | calidad de salida    | Aprobada |
| BE-16 | Rechazo del modelo                      | fallback conservador | Aprobada |

---

## 13. Catálogo de pruebas de autenticación

| ID    | Prueba                                              | Estado   |
| ----- | --------------------------------------------------- | -------- |
| AU-01 | `publicUser` elimina nombres comunes de contraseña  | Aprobada |
| AU-02 | Inicio valida campos y formato de correo            | Aprobada |
| AU-03 | Usuario inexistente produce 404                     | Aprobada |
| AU-04 | Contraseña incorrecta produce 401                   | Aprobada |
| AU-05 | Inicio correcto nunca devuelve hash                 | Aprobada |
| AU-06 | Registro valida antes de consultar MySQL            | Aprobada |
| AU-07 | Correo duplicado produce 409                        | Aprobada |
| AU-08 | Registro genera hash e inserta parámetros esperados | Aprobada |
| AU-09 | Error de base produce 500 controlado                | Aprobada |

---

## 14. Especificaciones Maestro

### 14.1 Decisión de herramienta

Se eligió Maestro porque opera en la capa de accesibilidad de React Native,
admite selectores por `testID`, tiene comandos declarativos y permite modelar
una pulsación sostenida con `longPressOn`. No requiere agregar una biblioteca de
automatización al código de la aplicación.

### 14.2 Flujo 01: validación de acceso

Archivo: `.maestro/01_login_validation.yaml`

Precondiciones:

- una sesión de Expo Go accesible;
- variable `APP_URL`.

Escenario:

1. abrir la aplicación;
2. esperar `login-screen`;
3. verificar campos;
4. enviar vacío y comprobar “Campos incompletos”;
5. introducir correo inválido;
6. comprobar “Correo inválido”;
7. verificar el enlace de registro.

Estado: **VALIDADA ESTÁTICAMENTE**.

### 14.3 Flujo 02: validación de registro

Archivo: `.maestro/02_registration_validation.yaml`

Escenario:

1. navegar desde acceso a registro;
2. enviar el formulario vacío;
3. comprobar el mensaje de campos;
4. completar nombre, contraseña y confirmación;
5. usar correo inválido;
6. comprobar el mensaje correspondiente.

Estado: **VALIDADA ESTÁTICAMENTE**.

### 14.4 Flujo 03: navegación autenticada

Archivo: `.maestro/03_authenticated_navigation.yaml`

Variables adicionales:

- `E2E_EMAIL`;
- `E2E_PASSWORD`.

Escenario:

1. permitir cámara y micrófono;
2. iniciar sesión con cuenta de prueba;
3. comprobar cámara, captura y micrófono;
4. abrir ajustes;
5. recorrer accesibilidad, interfaz y retroalimentación;
6. activar controles representativos.

Estado: **VALIDADA ESTÁTICAMENTE**.

### 14.5 Flujo 04: contrato de voz

Archivo: `.maestro/04_voice_hold_contract.yaml`

Escenario:

1. iniciar sesión;
2. esperar el micrófono;
3. ejecutar una pulsación de tres segundos;
4. comprobar que el sistema entra en procesamiento o muestra un error
   controlado.

Limitación: una pulsación automatizada no garantiza que el dispositivo reciba
una frase inteligible. Para validar el contenido debe inyectarse audio o
ejecutarse un guion supervisado.

Estado: **VALIDADA ESTÁTICAMENTE**.

### 14.6 Comandos de contrato

```powershell
npm run test:maestro-contract
```

Ejecución individual, cuando el entorno móvil esté disponible:

```powershell
maestro test -e APP_URL=exp://DIRECCION:8081 .maestro/01_login_validation.yaml
```

Las credenciales de prueba se proporcionan como variables en la terminal. No
deben escribirse en YAML.

---

## 15. Pruebas E2E y UAT pendientes

### 15.1 E2E sobre dispositivo

Casos mínimos:

| ID     | Escenario                               | Resultado esperado                          |
| ------ | --------------------------------------- | ------------------------------------------- |
| E2E-01 | Primer acceso y permiso de cámara       | Se muestra la cámara y controles accesibles |
| E2E-02 | Permiso de cámara denegado              | Mensaje comprensible y opción de reintento  |
| E2E-03 | Permiso de micrófono denegado           | No inicia grabación y anuncia la causa      |
| E2E-04 | Mantener y soltar micrófono             | Cambia de escuchando a procesando           |
| E2E-05 | Audio demasiado corto                   | Error controlado, sin bloqueo               |
| E2E-06 | Servicio de transcripción no disponible | Mensaje útil y recuperación                 |
| E2E-07 | Doble pulsación durante análisis        | Solicitud cancelada                         |
| E2E-08 | Repetir descripción                     | Se reproduce la última respuesta            |
| E2E-09 | Rotación durante captura                | No pierde control ni estado crítico         |
| E2E-10 | Navegación completa de ajustes          | Todas las pantallas son alcanzables         |

### 15.2 UAT con usuarios

Preguntas de aceptación:

1. ¿El usuario encuentra cámara y micrófono sin instrucción previa?
2. ¿Comprende que debe mantener y soltar?
3. ¿La vibración distingue inicio, éxito y cancelación?
4. ¿Los mensajes se escuchan con suficiente claridad?
5. ¿La descripción es útil para decidir el siguiente movimiento?
6. ¿El usuario detecta cuándo el sistema no tiene evidencia?
7. ¿El tiempo de respuesta es tolerable?
8. ¿La combinación de voz y cámara reduce esfuerzo?

Métricas recomendadas:

- tasa de tareas completadas;
- errores por tarea;
- tiempo hasta la primera interacción correcta;
- porcentaje de instrucciones transcritas correctamente;
- tasa de afirmaciones visuales falsas;
- valoración de confianza;
- escala SUS adaptada;
- comentarios cualitativos.

---

## 16. Matriz de trazabilidad

| Requisito | Implementación                            | Prueba actual                             | Brecha                      |
| --------- | ----------------------------------------- | ----------------------------------------- | --------------------------- |
| RF-01     | `CameraScreen.handleCapture`              | utilidades y backend                      | falta gesto real            |
| RF-02     | `/analyze`, `askOllama`                   | BE-02 a BE-04, BE-12                      | falta corpus visual         |
| RF-03     | `Speech.speak`                            | inspección de código                      | falta audio en dispositivo  |
| RF-04     | `startVoiceCommand`, `finishVoiceCommand` | utilidades, servicio, flujo 04            | falta gesto real            |
| RF-05     | `File.upload`, FFmpeg, Whisper, Ollama    | BE-05 a BE-10, integración real           | fidelidad visual abierta    |
| RF-06     | pantallas y controlador auth              | 4 cliente + 9 controlador + HTTP negativo | falta recorrido real        |
| RF-07     | cuatro pantallas de ajustes               | contrato Maestro                          | preferencias no globales    |
| RF-08     | temporizador, cancelación y repetición    | cancelación de servicio                   | falta interacción real      |
| RNF-01    | etiquetas y `testID`                      | contrato de selectores                    | falta auditoría con lector  |
| RNF-02    | tiempos y AbortController                 | pruebas de aborto                         | falta interrupción real     |
| RNF-03    | `x-powered-by` desactivado                | BE-01                                     | CORS sigue abierto          |
| RNF-04    | límites JSON, Multer y FFmpeg             | BE-05, BE-09, BE-11                       | falta prueba de 413         |
| RNF-05    | prompt, 25 palabras y fallback            | BE-15, BE-16                              | alucinación no resuelta     |
| RNF-06    | `.gitignore`, `.env.example`              | inspección                                | historial Git no disponible |
| RNF-07    | scripts y suites                          | 68 pruebas                                | E2E y UAT pendientes        |

---

## 17. Seguridad, privacidad y confiabilidad

### 17.1 Controles existentes

- consultas parametrizadas;
- hash bcrypt;
- eliminación de contraseñas en respuesta;
- límites de cuerpo y archivo;
- rechazo de MIME no audio;
- desactivación de `x-powered-by`;
- mensajes de error controlados;
- variables de entorno para servicios;
- exclusión de `.env`;
- cancelación de procesos y solicitudes;
- límite de duración de audio.

### 17.2 Riesgos abiertos

#### Auditoría raíz

La auditoría reporta 42 avisos: 10 moderados y 32 altos. Las rutas principales
se relacionan con `brace-expansion`, `uuid`, herramientas Jest/ESLint y
dependencias fijadas por Expo/React Native. Las correcciones automáticas
forzadas proponen versiones incompatibles con Expo SDK 56. No se aplicaron.

Acción recomendada: revisar avisos por explotabilidad real, mantener el SDK
actualizado dentro de su línea compatible y repetir la auditoría en cada cambio
de dependencias.

#### CORS y autenticación de API

Los servicios usan CORS sin una lista restrictiva. El backend de visión no
exige una sesión. Deben definirse orígenes permitidos, límites por cliente y un
mecanismo de autorización antes de exponer el sistema a usuarios no
controlados.

#### Datos biométricos y visuales

Audio e imágenes pueden contener información sensible. El diseño actual envía
imagen Base64 y conserva temporalmente el archivo de audio en el directorio de
documentos. Se necesita una política explícita de minimización, borrado,
retención y registro.

#### Alucinaciones

La respuesta del modelo puede contradecir la imagen. Para una herramienta
asistiva, el riesgo es mayor que un simple error de texto. Debe preferirse una
respuesta incierta antes que una ubicación falsa.

### 17.3 Archivo de secretos

El archivo real `dbconfig/.env` no debe copiarse al documento ni a chats. Si en
algún momento estuvo bajo control de versiones, las credenciales deben
considerarse expuestas y reemplazarse. El archivo ejemplo solo contiene nombres
de variables.

---

## 18. Accesibilidad

### 18.1 Medidas presentes

- botones grandes en cámara;
- etiquetas accesibles;
- roles de botón;
- estado `disabled` y `busy`;
- regiones vivas para mensajes;
- anuncios con `AccessibilityInfo`;
- vibración para selección, éxito y cancelación;
- síntesis en `es-MX`;
- selectores estables coincidentes con el árbol accesible;
- descripción del logotipo;
- controles ubicados en extremos opuestos.

### 18.2 Brechas

- idiomas mezclados entre inglés y español;
- ajustes de TalkBack, tamaño, contraste y vibración no se aplican fuera de su
  pantalla;
- no existe prueba ejecutada con TalkBack;
- no se comprobó orden de foco;
- no se midió contraste de todos los estados;
- iconos sin texto visible dependen de la etiqueta accesible;
- no existe un tutorial que explique “mantener y soltar”;
- el tiempo de bienvenida de siete segundos retrasa la interacción automatizada
  y puede frustrar al usuario.

### 18.3 Guion manual de accesibilidad

1. Activar TalkBack.
2. Recorrer acceso y registro sin mirar la pantalla.
3. Confirmar que cada campo anuncia propósito y estado.
4. Llegar a cámara y distinguir los tres controles.
5. Mantener micrófono y escuchar cambio de estado.
6. Provocar un error y verificar que se anuncie una sola vez.
7. Cancelar análisis y verificar vibración y voz.
8. Rotar el dispositivo y repetir.
9. Comprobar que ningún control quede fuera del foco.

---

## 19. Reproducibilidad

### 19.1 Requisitos locales

- Node.js compatible con Expo SDK 56;
- npm;
- FFmpeg disponible en `PATH`;
- Ollama con el modelo visual configurado;
- ejecutable `whisper-server.exe`;
- modelo `C:\capstone\whisper\Release\models\ggml-small.bin`;
- variables de base de datos en `dbconfig/.env`.

### 19.2 Comandos de calidad

```powershell
npm run test:all
npm run lint
npm run format:check
npx expo-doctor --verbose
npm audit --omit=dev
npm --prefix backend audit --omit=dev
npm run test:database-connection
```

### 19.3 Prueba integral de voz

Definir un archivo M4A de prueba:

```powershell
$env:VOICE_TEST_AUDIO = "C:\ruta\comando.m4a"
npm run test:voice-integration
```

Salida esperada:

- estado 200;
- `elapsedMs`;
- transcripción no vacía;
- resultado no vacío.

La aprobación técnica no implica aprobación semántica. La imagen usada debe
tener una referencia conocida.

### 19.4 Servicios esperados durante verificación

| Puerto | Servicio                                 |
| -----: | ---------------------------------------- |
|   3000 | Backend de visión y voz                  |
|   3001 | Autenticación                            |
|   8080 | whisper.cpp                              |
|  11434 | Ollama                                   |
|   8081 | Metro cuando se prueba la interfaz móvil |

---

## 20. Riesgos y prioridades

| Prioridad | Riesgo                                  | Siguiente acción                                       |
| --------- | --------------------------------------- | ------------------------------------------------------ |
| P0        | Afirmaciones visuales falsas            | corpus anotado, umbral conservador y prueba automática |
| P1        | Falta de E2E real                       | preparar entorno y ejecutar cuatro flujos              |
| P1        | Preferencias sin efecto                 | estado global, persistencia y pruebas                  |
| P1        | API sin autorización ni control de tasa | diseñar seguridad de sesión y límites                  |
| P1        | Avisos de dependencias raíz             | análisis de explotabilidad y actualización compatible  |
| P2        | Audio persistente sin limpieza          | borrado tras respuesta y en rutas de error             |
| P2        | URLs predeterminadas rígidas            | exigir configuración y validar al iniciar              |
| P2        | Mezcla de idioma                        | catálogo de cadenas y revisión                         |
| P2        | Sin prueba explícita de 413             | agregar cuerpos y archivos sobre límite                |
| P3        | Bienvenida fija de siete segundos       | permitir continuar o reducir espera                    |

---

## 21. Plan de pruebas siguiente

### Fase A: confianza semántica

1. Crear 50 imágenes anotadas.
2. Definir 10 instrucciones de búsqueda.
3. Ejecutar 500 combinaciones.
4. Medir falsos positivos, falsos negativos y posición incorrecta.
5. Bloquear respuestas que no alcancen criterio conservador.

### Fase B: interacción móvil

1. Ejecutar los dos flujos sin autenticación.
2. Crear una cuenta de prueba aislada.
3. Ejecutar navegación autenticada.
4. Ejecutar voz con entrada controlada.
5. Guardar capturas y tiempos.
6. Repetir en dos tamaños de pantalla.

### Fase C: accesibilidad

1. Revisión TalkBack.
2. Orden de foco.
3. Etiquetas y estados.
4. Contraste.
5. Tamaños táctiles.
6. Sesión UAT supervisada.

### Fase D: resiliencia

1. Whisper detenido.
2. Ollama detenido.
3. FFmpeg ausente.
4. Red lenta.
5. solicitud cancelada;
6. audio vacío;
7. archivo de 12 MB y superior;
8. imagen Base64 cerca del límite;
9. dos gestos consecutivos;
10. cambio de orientación durante procesamiento.

---

## 22. Estructura recomendada para un documento de 200 páginas

| Capítulo                    | Páginas objetivo | Contenido                                  |
| --------------------------- | ---------------: | ------------------------------------------ |
| Preliminares                |                8 | portada, control, resumen, índices         |
| Resumen ejecutivo ampliado  |                8 | resultados, decisiones y estado            |
| Problema y usuarios         |               10 | contexto, accesibilidad, necesidades       |
| Requisitos                  |               14 | funcionales, no funcionales y aceptación   |
| Arquitectura                |               18 | componentes, datos, secuencias y contratos |
| Aplicación móvil            |               26 | navegación, pantallas, cámara, audio, UX   |
| Backend e IA                |               22 | API, FFmpeg, Whisper, Ollama y seguridad   |
| Autenticación y datos       |               14 | reglas, consultas, modelo y privacidad     |
| Cambios e incidencias       |               18 | cronología, causas, correcciones           |
| Estrategia de pruebas       |               16 | niveles, herramientas y ambientes          |
| Catálogo de pruebas         |               18 | casos detallados y evidencias              |
| Trazabilidad                |                8 | requisitos, código, casos y brechas        |
| Calidad y seguridad         |                8 | auditoría, accesibilidad, riesgos          |
| Riesgos y trabajo siguiente |                6 | prioridades y criterios de salida          |
| Apéndices                   |                6 | comandos, glosario y referencias           |
| **Total**                   |          **200** | objetivo editorial                         |

### 22.1 Plantilla de caso de prueba

Cada caso ampliado debe contener:

1. identificador;
2. nombre;
3. requisito asociado;
4. objetivo;
5. precondiciones;
6. datos;
7. pasos;
8. resultado esperado;
9. resultado observado;
10. estado;
11. evidencia;
12. incidencia vinculada;
13. fecha;
14. ambiente;
15. notas de accesibilidad;
16. riesgo cubierto.

### 22.2 Plantilla de incidencia

1. identificador;
2. resumen;
3. severidad;
4. componente;
5. versión;
6. precondiciones;
7. pasos para reproducir;
8. resultado esperado;
9. resultado observado;
10. evidencia;
11. análisis de causa;
12. corrección;
13. archivos modificados;
14. pruebas de regresión;
15. riesgo residual;
16. estado.

### 22.3 Evidencia que debe solicitarse antes de ampliar

- capturas reales de cada pantalla;
- diagrama de datos con columnas no sensibles;
- decisiones de diseño originales;
- registro de sesiones con usuarios;
- resultados Maestro ejecutados;
- corpus visual anotado;
- mediciones repetidas de latencia;
- cobertura de código;
- inventario de licencias;
- política de privacidad;
- bitácora cronológica de cambios.

Si no existe evidencia, el documento debe usar un marcador explícito:
`[EVIDENCIA PENDIENTE]`.

---

## 23. Paquete de contexto para otro chat de ChatGPT

### 23.1 Fuente de verdad

El chat redactor debe recibir:

1. este archivo completo;
2. el código fuente actual;
3. salidas de las pruebas finales;
4. las imágenes de interfaz disponibles;
5. las 22 fuentes documentales incorporadas en la sección 27;
6. cualquier evidencia adicional que se genere después.

Orden de prioridad:

1. resultados ejecutados;
2. código actual;
3. este dossier;
4. artefactos actuales del proyecto;
5. documentación histórica o borradores;
6. material didáctico;
7. inferencias claramente rotuladas.

### 23.2 Hechos que no deben alterarse

- Expo SDK 56.0.17.
- React Native 0.85.3.
- React 19.2.3.
- `expo-audio` 56.0.13.
- `expo-file-system` 56.0.8.
- `expo-camera` 56.0.8.
- carga de audio con `File.upload`.
- audio M4A convertido a WAV mono de 16 kHz.
- Whisper con `ggml-small.bin`.
- 68 pruebas automáticas aprobadas.
- 4 flujos Maestro preparados, no ejecutados en dispositivo.
- `expo-doctor` 21/21.
- backend con cero vulnerabilidades en auditoría final.
- auditoría raíz con 42 avisos.
- base de datos conectada, MySQL 9.4.0, 7 tablas.
- integración de voz con HTTP 200 y transcripción exacta en una muestra.
- fidelidad visual fallida por una respuesta inventada.
- 22 fuentes adicionales revisadas: 5 presentaciones, 4 PDF, 11 documentos
  de Word, 1 libro de Excel y 1 diagrama PNG.
- los casos CP-01 a CP-17 son registros manuales históricos y no se suman a
  las 68 pruebas automatizadas.
- la entrevista disponible corresponde a una sola persona, anonimizada como
  P01; sus respuestas no pueden generalizarse.
- el modelo de siete entidades es conceptual y no demuestra por sí solo el
  esquema físico conectado.

### 23.3 Prompt maestro

```text
Actúa como arquitecto de software, líder de pruebas y redactor técnico senior.
Debes producir un documento formal en español de aproximadamente 200 páginas
sobre el proyecto VERIA, usando exclusivamente el dossier y los archivos que te
proporcione.

Objetivos:
1. Explicar el problema, los usuarios, requisitos, arquitectura y módulos.
2. Narrar todos los cambios, incluyendo errores iniciales, causas y
   correcciones.
3. Separar de manera inequívoca pruebas ejecutadas, validadas estáticamente,
   pendientes e incidencias abiertas.
4. Construir matrices de trazabilidad entre requisitos, código, pruebas y
   riesgos.
5. Describir la interacción de cámara y la pulsación sostenida del micrófono.
6. Explicar el transporte multipart, FFmpeg, whisper.cpp, Ollama,
   autenticación y MySQL.
7. Incluir el catálogo completo de pruebas con formato profesional.
8. Tratar accesibilidad, privacidad, seguridad y confiabilidad como temas
   centrales.

Reglas:
- No inventes ejecuciones, métricas, capturas, entrevistas ni resultados.
- No conviertas HTTP 200 en prueba de corrección semántica.
- Conserva como incidencia abierta la alucinación visual.
- No expongas credenciales, hosts privados sensibles ni datos personales.
- Si falta evidencia, escribe [EVIDENCIA PENDIENTE].
- Si realizas una inferencia, escribe [INFERENCIA] y explica su base.
- Usa las etiquetas [EJECUTADA], [VALIDADA ESTÁTICAMENTE], [PENDIENTE],
  [CORREGIDA Y REVALIDADA] e [INCIDENCIA ABIERTA].
- Mantén consistencia entre cifras, tablas y narrativa.
- No agregues temas fuera del alcance técnico entregado.
- Clasifica las fuentes como evidencia ejecutada, artefacto actual, registro
  histórico, borrador o material didáctico.
- Cuando una fuente contradiga al código o a una ejecución reciente, conserva
  la contradicción y da prioridad a la evidencia más reciente y reproducible.
- Anonimiza a la persona entrevistada como P01 y no reproduzcas datos que
  permitan identificarla.

Estructura:
- preliminares e índices;
- resumen ejecutivo;
- contexto del problema y usuarios;
- requisitos y criterios de aceptación;
- arquitectura y flujos;
- aplicación móvil;
- backend e inteligencia artificial;
- autenticación y datos;
- registro de cambios e incidencias;
- estrategia y ambientes de prueba;
- catálogo de pruebas;
- resultados y análisis;
- trazabilidad;
- accesibilidad;
- seguridad y privacidad;
- riesgos;
- plan de calidad siguiente;
- apéndices, glosario y referencias.

Para cada capítulo:
- inicia con objetivo y alcance;
- desarrolla el contenido con evidencia;
- agrega tablas solo cuando mejoren la comprensión;
- termina con hallazgos, limitaciones y referencias cruzadas;
- asigna identificadores estables a requisitos, pruebas e incidencias.

Antes de redactar, crea un mapa de capítulos cuya suma sea 200 páginas. Después
redacta por bloques para permitir revisión incremental. No repitas contenido
para completar páginas.
```

### 23.4 Preguntas que el redactor debe resolver con evidencia

1. ¿Qué preferencias deben persistirse y cómo afectan a cámara?
2. ¿Cuál es el esquema lógico de las siete tablas?
3. ¿Qué porcentaje de instrucciones reconoce Whisper en ruido real?
4. ¿Qué tasa de alucinación tiene cada modelo visual?
5. ¿Qué tiempo de respuesta es aceptable para los usuarios?
6. ¿Qué nivel de detalle prefieren personas con baja visión?
7. ¿Cómo se eliminarán audio e imagen tras una solicitud?
8. ¿Cómo se verificará contraste y orden de foco?
9. ¿Qué controles deben requerir sesión?
10. ¿Cuál es el criterio de salida para cerrar E2E y UAT?

---

## 24. Glosario

| Término         | Definición                                                             |
| --------------- | ---------------------------------------------------------------------- |
| AbortController | API para cancelar una solicitud asíncrona.                             |
| Base64          | Representación textual de datos binarios; se usa para la imagen.       |
| E2E             | Prueba del recorrido completo desde la interfaz hasta los servicios.   |
| FFmpeg          | Herramienta de conversión de audio y video.                            |
| FormData        | Formato multipart para campos y archivos HTTP.                         |
| Jest            | Ejecutor de pruebas JavaScript usado en el cliente.                    |
| Maestro         | Herramienta declarativa de automatización móvil.                       |
| M4A             | Contenedor de audio producido por el preset de alta calidad.           |
| Multer          | Middleware de Express para archivos multipart.                         |
| Ollama          | Motor local que ejecuta el modelo visual.                              |
| PCM             | Codificación de audio sin compresión usada en el WAV.                  |
| `testID`        | Identificador estable expuesto al árbol nativo.                        |
| UAT             | Prueba de aceptación con usuarios o representantes.                    |
| WAV             | Formato entregado a whisper.cpp tras la conversión.                    |
| Whisper         | Modelo de reconocimiento de voz; aquí se ejecuta mediante whisper.cpp. |

---

## 25. Referencias técnicas

- Expo SDK 56: https://docs.expo.dev/versions/v56.0.0/
- Expo Audio 56: https://docs.expo.dev/versions/v56.0.0/sdk/audio/
- Expo FileSystem 56: https://docs.expo.dev/versions/v56.0.0/sdk/filesystem/
- Expo Camera 56: https://docs.expo.dev/versions/v56.0.0/sdk/camera/
- Pruebas unitarias con Jest en Expo:
  https://docs.expo.dev/develop/unit-testing/
- Maestro para React Native:
  https://docs.maestro.dev/platform-support/react-native
- Comando `longPressOn`:
  https://docs.maestro.dev/reference/commands-available/longpresson
- Selectores Maestro:
  https://docs.maestro.dev/reference/selectors/core-selectors
- whisper.cpp: https://github.com/ggml-org/whisper.cpp
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md

---

## 26. Nota de continuidad

El cierre técnico definitivo se conserva al final del dossier. Las secciones
27 a 35 incorporan y concilian el corpus documental proporcionado el 24 de
julio de 2026. Su propósito no es reemplazar los resultados reproducibles de
las secciones anteriores, sino aportar contexto histórico, requisitos,
planeación, investigación con usuarios y criterios formales de prueba.

---

## 27. Corpus documental incorporado

### 27.1 Alcance de la revisión

Se revisaron 22 archivos: 5 presentaciones, 4 PDF, 11 documentos de Word, 1
libro de Excel y 1 imagen de modelo de datos. La revisión combinó extracción de
texto y tablas con renderizado visual. Se inspeccionaron las 89 diapositivas de
las presentaciones, las páginas de los PDF, las hojas del libro y las versiones
renderizadas de los documentos de Word. Este procedimiento permitió detectar
contenido que no aparece bien en una extracción lineal, como diagramas,
capturas, calendarios y organigramas.

La presencia de una afirmación en una fuente no la convierte automáticamente
en un hecho actual. Cada archivo se clasifica de acuerdo con la fuerza de su
evidencia:

| Nivel | Clase                                  | Uso permitido                                                                   |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------- |
| A     | Ejecución reproducible o código actual | Sustenta el estado actual y las cifras consolidadas                             |
| B     | Artefacto vigente del proyecto         | Sustenta requisitos, diseño o decisiones si no contradice al nivel A            |
| C     | Registro histórico o borrador          | Explica evolución; requiere conciliación antes de afirmar vigencia              |
| D     | Material didáctico                     | Aporta estructura y conceptos; no prueba que VERIA haya ejecutado una actividad |

### 27.2 Inventario y función de cada fuente

| ID   | Archivo                                                  | Tipo         | Clasificación | Uso dentro del dossier                                                      |
| ---- | -------------------------------------------------------- | ------------ | ------------- | --------------------------------------------------------------------------- |
| F-01 | Informes técnicos.pptx                                   | Presentación | D             | Estructura del informe, claridad, resultados, conclusiones y revisión       |
| F-02 | Pruebas Automatizadas.pptx                               | Presentación | D             | Ciclo de automatización, selección de herramientas y análisis de resultados |
| F-03 | Tipos de pruebas manuales.pptx                           | Presentación | D             | Casos, criterios de aceptación, evidencia y defectos                        |
| F-04 | Pruebas de software(1).pptx                              | Presentación | D             | Niveles funcionales, no funcionales, regresión y aceptación                 |
| F-05 | Metodologías y documentación en pruebas de software.pptx | Presentación | D             | Planeación, diseño, ejecución, defectos y cierre basado en riesgo           |
| F-06 | Software Development Life Cycle.pdf                      | PDF          | D             | Marco general de ciclo de vida y relación entre fases y artefactos          |
| F-07 | PERT - PERT.pdf                                          | PDF          | B/C           | Estimaciones del plan; no son duraciones observadas                         |
| F-08 | Software Design and Analysis .pdf                        | PDF          | B/C           | Requisitos, diseño, UML y pantallas de una etapa anterior                   |
| F-09 | manuel1.pdf                                              | PDF          | C             | Borrador posterior a la fecha de corte; solo inspira estructura             |
| F-10 | ALVARADO-DE_AVILA-RIVERA(1).docx                         | Word         | B/C           | Alcance, MoSCoW, roles y requisitos de proyecto                             |
| F-11 | BASE DE DATOS VERIA.docx                                 | Word         | B/C           | Catálogo conceptual de entidades y atributos                                |
| F-12 | ALVARADO-DE_AVILA-RIVERA.docx                            | Word         | B/C           | Variante del perfil, requisitos y responsabilidades                         |
| F-13 | Avances 17*Julio_2026*.docx                              | Word         | C             | Evidencia histórica de código, pantallas y servicios                        |
| F-14 | DE AVILA - RIVERA .docx                                  | Word         | C             | Planteamiento, metodología y referencias de investigación                   |
| F-15 | DE AVILA - RIVERA(1).docx                                | Word         | B/C           | Instrumentos propuestos para usuarios, expertos y docentes                  |
| F-16 | De_Avila-Rivera 3_B.docx                                 | Word         | B/C           | Investigación extensa, marco teórico y metodología propuesta                |
| F-17 | IA integration(1).docx                                   | Word         | C             | Recomendaciones generales de capacidad de cómputo                           |
| F-18 | IA integration.docx                                      | Word         | C             | Duplicado funcional del archivo anterior                                    |
| F-19 | Interview*Guide*[anonimizado].docx                       | Word         | B             | Una entrevista contestada; se anonimiza como P01                            |
| F-20 | Software Design and Analysis .docx                       | Word         | B/C           | Versión editable equivalente al documento de diseño                         |
| F-21 | Organigrama \_ Calendario.xlsx                           | Excel        | B/C           | Casos CP-01–CP-17, calendario y organigrama histórico                       |
| F-22 | Database V1.png                                          | Imagen       | B/C           | Modelo conceptual de siete entidades                                        |

### 27.3 Duplicados, fechas y límites

Las dos variantes de `ALVARADO-DE_AVILA-RIVERA` tienen contenido muy cercano,
pero no idéntico. Las dos variantes de `IA integration` presentan el mismo
contenido visible. No se cuentan como evidencia independiente cuando sostienen
la misma afirmación.

`manuel1.pdf` está fechado el 14 de agosto de 2026, después del corte de este
dossier. Se trata como borrador posterior: sus tablas, porcentajes o
conclusiones no sustituyen las ejecuciones del 24 de julio. Puede reutilizarse
como índice editorial o lista de temas, pero cada resultado deberá
revalidarse.

El material docente describe buenas prácticas generales. Sirve para justificar
la forma del reporte, no para declarar que VERIA ya ejecutó una técnica. Por
ejemplo, que una diapositiva explique partición de equivalencia no demuestra
que todos los formularios de VERIA hayan sido probados con esa técnica.

### 27.4 Regla de resolución de contradicciones

Cuando dos fuentes difieren, se aplica esta secuencia:

1. comprobar si existe una ejecución reproducible con fecha y salida;
2. inspeccionar el código actual y sus contratos;
3. consultar artefactos de requisitos o diseño vigentes;
4. conservar el registro histórico como explicación de la evolución;
5. marcar como `[EVIDENCIA PENDIENTE]` lo que no pueda decidirse.

La regla evita dos errores frecuentes: presentar una intención antigua como
implementación actual y sumar resultados incompatibles dentro de una misma
métrica.

---

## 28. Evolución del diseño y conciliación con el código

### 28.1 Propuesta anterior frente a implementación actual

Los documentos de análisis describen alternativas nativas y un prototipo de
pantallas. El repositorio actual utiliza Expo y React Native. Esta diferencia
no se considera una falla; representa una decisión de implementación que debe
documentarse para no mezclar arquitectura propuesta con arquitectura
construida.

| Tema                            | Propuesta o registro anterior                                 | Estado comprobado al corte                                                                      | Evidencia dominante                           |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Cliente móvil                   | Alternativas nativas y prototipos visuales                    | Expo SDK 56, React Native 0.85.3 y React 19.2.3                                                 | `package.json`, configuración y `expo-doctor` |
| Navegación                      | Flujo conceptual entre bienvenida, acceso, cámara y ajustes   | Navegación implementada y selectores estables añadidos                                          | Código actual y pruebas                       |
| Captura                         | Cámara como función central                                   | Captura, conversión Base64 y envío al backend                                                   | Código y pruebas del cliente                  |
| Voz de salida                   | Descripción auditiva de la imagen                             | Lectura de respuesta disponible en el flujo                                                     | Código actual                                 |
| Voz de entrada                  | Requisito FR06 marcado originalmente para una etapa posterior | Pulsación sostenida, grabación, conversión, Whisper y prompt implementados                      | Código, pruebas y ejecución integral          |
| Inteligencia visual             | Reconocimiento descrito como objetivo                         | Servicio conectado a Ollama y respuesta normalizada                                             | Backend y prueba integral                     |
| Autenticación                   | Guardar y recuperar personalización mediante cuenta           | Rutas de registro y acceso con MySQL; persistencia de preferencias requiere evidencia adicional | Pruebas de autenticación y consulta de base   |
| Ajustes                         | Tema, vibración, sonido y accesibilidad                       | Pantallas presentes; no todas las preferencias conceptuales están demostradas como persistentes | Código e inspección                           |
| Historial y objetos recurrentes | Requisitos FR08 y modelo conceptual                           | No se acreditan como funciones completas                                                        | `[EVIDENCIA PENDIENTE]`                       |

### 28.2 Cambios funcionales que alteran la línea base

El requisito FR06 es el ejemplo principal de evolución. La documentación lo
clasificaba como una capacidad futura, pero el código actual ya implementa el
contrato de mantener presionado el micrófono, hablar y soltar para enviar la
grabación. Por tanto, la prioridad histórica se conserva en la trazabilidad,
pero su estado actual cambia a “implementado con validación parcial”.

El análisis visual también pasó de una expectativa general a un servicio
ejecutable. Sin embargo, la ejecución que transcribió “Busca mis llaves” y
respondió HTTP 200 produjo una descripción con elementos no respaldados por la
imagen. La conciliación correcta es:

- transporte y transcripción: evidencia positiva en una muestra;
- respuesta del modelo: evidencia negativa de fidelidad en esa muestra;
- precisión general: no demostrada;
- aptitud para decisiones de riesgo: no demostrada.

### 28.3 Responsabilidades documentadas

Las variantes del perfil de proyecto asignan las siguientes responsabilidades:

| Integrante                         | Responsabilidad documentada                                |
| ---------------------------------- | ---------------------------------------------------------- |
| Natahel Emiliano Alvarado Resendiz | Backend, diseño de base de datos, especificación y pruebas |
| Jahaziel Edrei De Avila Carrasco   | Análisis, UX/UI, frontend, prototipos y pruebas            |
| Erik Israel Rivera Salazar         | Backend, integración de inteligencia artificial y pruebas  |

Esta tabla registra la organización declarada por el equipo. No se usa para
inferir autoría de líneas específicas ni para asignar culpas por incidencias.

### 28.4 Deuda de documentación detectada

- existen identificadores duplicados en la línea base histórica: FR03 se usa
  tanto para acceso como para compatibilidad con dispositivos;
- algunos requisitos mezclan capacidad funcional, plataforma y atributo de
  calidad;
- se usan expresiones como “correctamente” o “altamente preciso” sin umbral
  cuantitativo;
- las fuentes alternan nombres de producto y convenciones de mayúsculas;
- algunas conclusiones antiguas describen prototipos, mientras el repositorio
  ya contiene módulos operativos;
- las referencias legales y de salud presentes en borradores deben verificarse
  con fuentes oficiales antes de una versión académica final.

---

## 29. Investigación con usuarios y criterios derivados

### 29.1 Evidencia disponible

El corpus incluye cuestionarios propuestos para personas ciegas, personas con
baja visión, especialistas de accesibilidad y docentes. Solo se encontró una
entrevista contestada. Para proteger la identidad, el dossier la denomina
**P01** y omite el nombre del archivo como identificador personal dentro de los
resultados.

P01 es una persona adulta con pérdida visual reciente. Reportó uso de lector de
pantalla y bastón, autonomía parcial con el teléfono y necesidad de ayuda para
actividades concretas. Entre las dificultades seleccionadas aparecen:

- distinguir objetos y colores;
- desplazarse en espacios públicos;
- comprender etiquetas o controles cuando no están bien anunciados;
- obtener una identificación rápida del objeto enfocado.

P01 manifestó preferencia por comandos de voz y valoró la identificación de
objetos mediante cámara. Estos hallazgos son cualitativos y corresponden a una
sola experiencia.

### 29.2 Lo que puede y no puede concluirse

| Afirmación                                                | Estado                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| La interacción por voz responde a una necesidad expresada | Respaldada por P01 y coherente con los instrumentos         |
| Las etiquetas accesibles son importantes                  | Respaldada por P01 y por el riesgo observado en CP-01/CP-02 |
| Todas las personas con discapacidad visual prefieren voz  | No demostrada                                               |
| La aplicación mejora independencia                        | Hipótesis; requiere estudio de uso                          |
| Un único tamaño de botón sirve para todos                 | No demostrada                                               |
| La respuesta visual es suficientemente segura             | Contradicha por INC-010                                     |

El tamaño de muestra es `n = 1`. Los documentos proponen tamaños distintos para
una fase de investigación más amplia —entre 5 y 10, o entre 10 y 15
participantes según la versión—. Esa inconsistencia debe resolverse en el
protocolo antes de iniciar una evaluación formal.

### 29.3 Criterios de aceptación derivados

Los siguientes criterios convierten necesidades cualitativas en condiciones
observables:

| ID        | Criterio                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------- |
| AC-USR-01 | Cada control crítico anuncia función, estado y acción mediante el lector de pantalla                      |
| AC-USR-02 | El usuario puede iniciar y detener la grabación sin depender de una señal exclusivamente visual           |
| AC-USR-03 | La aplicación confirma mediante audio y, cuando corresponda, señal háptica que está grabando o procesando |
| AC-USR-04 | Una respuesta incierta evita afirmar ubicación o identidad como hecho                                     |
| AC-USR-05 | Los errores indican una acción de recuperación concreta                                                   |
| AC-USR-06 | El flujo principal puede completarse con lector de pantalla y sin ayuda visual                            |
| AC-USR-07 | Los controles táctiles críticos tienen área suficiente y no se solapan                                    |
| AC-USR-08 | El usuario puede repetir la respuesta auditiva sin repetir todo el análisis                               |

### 29.4 Protocolo recomendado para ampliar la evidencia

1. definir criterios de inclusión y consentimiento;
2. separar personas ciegas, baja visión y expertos como grupos analíticos;
3. probar con su tecnología de asistencia habitual;
4. usar tareas realistas y objetos no peligrosos;
5. registrar éxito, ayuda requerida, tiempo, errores y comentarios;
6. detener la tarea si una respuesta puede inducir una acción insegura;
7. anonimizar datos y evitar conservar audio o imágenes sin necesidad;
8. documentar desviaciones del protocolo.

Cubrir los ojos de una persona vidente o usar a otra persona como “lector
humano” puede servir para explorar un guion, pero no sustituye una evaluación
con usuarios ni reproduce el comportamiento de TalkBack.

---

## 30. Línea base de requisitos y MoSCoW

### 30.1 Requisitos funcionales históricos

| ID histórico | Descripción normalizada                                        | Prioridad original | Estado al corte                                                                |
| ------------ | -------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| FR01         | Capturar una fotografía y utilizarla para el análisis          | Must               | Implementado; el almacenamiento permanente no está acreditado                  |
| FR02         | Entregar información auditiva derivada de la imagen            | Must               | Implementado y cubierto parcialmente                                           |
| FR03-A       | Registrar e iniciar sesión para asociar preferencias           | Should             | Implementado en autenticación; persistencia integral de preferencias pendiente |
| FR03-B       | Ejecutarse en Android de recursos limitados                    | Could              | Identificador duplicado; compatibilidad de gama baja no medida                 |
| FR04         | Modificar tema, vibración y sonido                             | Should             | Interfaz presente; persistencia y efecto completo pendientes de evidencia      |
| FR05         | Analizar fotografías y describirlas de acuerdo con la consulta | Must               | Implementado; fidelidad semántica abierta por INC-010                          |
| FR06         | Capturar comandos de voz desde el control de micrófono         | Will               | Implementado después de la línea base; Maestro validado estáticamente          |
| FR07         | Describir mediante video en tiempo real                        | Will               | No acreditado                                                                  |
| FR08         | Recordar objetos recurrentes y preferencias                    | Will               | No acreditado                                                                  |

### 30.2 Requisitos no funcionales históricos

| ID    | Atributo            | Formulación útil                                                             | Estado                                                                           |
| ----- | ------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| NF01  | Rendimiento         | Completar el procesamiento en menos de 8 segundos bajo condiciones definidas | Una muestra integral tardó 3.811 s; no demuestra distribución ni peor caso       |
| NFR02 | Compatibilidad      | Operar en dispositivos Android de recursos limitados                         | Falta matriz de dispositivos y umbral mínimo                                     |
| NFR03 | Accesibilidad       | Ser operable con tecnologías de asistencia y controles perceptibles          | Mejorado con etiquetas y `testID`; requiere recorrido real                       |
| NFR04 | Confiabilidad       | Evitar identificaciones peligrosas y expresar incertidumbre                  | No satisfecho mientras INC-010 permanezca abierta                                |
| NFR05 | Protección de datos | Proteger cuenta, preferencias y material capturado                           | Hash de contraseña y secretos separados; falta política verificable de retención |
| NFR06 | Claridad del modelo | Responder de forma natural, no ambigua y sin afirmaciones infundadas         | Fallback mejorado; desempeño general no medido                                   |

### 30.3 Criterios verificables que faltan

Para que la línea base pueda probarse de forma objetiva, se requieren umbrales:

- percentil de tiempo y condiciones de red, modelo y dispositivo para NF01;
- conjunto de dispositivos, memoria y versión mínima para NFR02;
- versión de WCAG o guía móvil y lista de verificaciones para NFR03;
- métrica de exactitud, abstención y severidad para NFR04;
- periodos de retención y eliminación para NFR05;
- rúbrica de claridad, incertidumbre y lenguaje para NFR06.

### 30.4 Trazabilidad resumida de requisitos

| Requisito | Módulo principal                          | Evidencia automatizada                           | Evidencia adicional necesaria      |
| --------- | ----------------------------------------- | ------------------------------------------------ | ---------------------------------- |
| FR01      | `CameraScreen` y utilidades de cámara     | Pruebas de captura/URI/Base64                    | Recorrido en dispositivo           |
| FR02      | Servicio visual y lectura de respuesta    | Contratos de cliente/backend                     | Comprensión con usuarios           |
| FR03-A    | Servicios y rutas de autenticación        | 13 pruebas distribuidas entre cliente y servicio | Persistencia de preferencias       |
| FR04      | Settings, Accessibility e Interface       | Selectores y navegación parcial                  | Efecto real y persistencia         |
| FR05      | `/api/ai/analyze` y Ollama                | Backend y ejecución integral                     | Corpus anotado                     |
| FR06      | `useAudioRecorder`, carga y `/transcribe` | Jest, backend y contrato Maestro                 | Ejecución del gesto en dispositivo |
| NFR03     | Propiedades de accesibilidad              | Contrato estático                                | TalkBack, foco y contraste         |
| NFR04     | Prompt, normalización y manejo de error   | Pruebas de fallback                              | Métricas de fidelidad y abstención |

---

## 31. Metodología de pruebas manuales y registro histórico

### 31.1 Criterio adoptado

Las presentaciones de pruebas manuales e informes técnicos recomiendan que cada
caso identifique objetivo, precondiciones, datos, pasos, resultado esperado,
resultado obtenido, evidencia, estado e incidencia. También separan aceptación
de rechazo y piden revisar los defectos antes del cierre.

Para VERIA se adopta la siguiente regla:

- **Aprobado:** el resultado esperado se cumple y no existe una incidencia que
  invalide el objetivo;
- **Aprobado con observación:** el objetivo se cumple, pero existe una
  desviación menor que no afecta el criterio principal;
- **Fallido:** el criterio no se cumple o la incidencia contradice el estado;
- **Bloqueado:** una dependencia impide ejecutar;
- **No ejecutado:** existe el caso, pero no hay evidencia suficiente.

### 31.2 Revisión de CP-01 a CP-17

La hoja `Hoja 1` registra 17 casos históricos. Dieciséis aparecen como
`Passed` y CP-13 como `Failed`. Sin embargo, varias incidencias describen
validaciones ausentes, diseño poco accesible, datos no guardados, dependencia
manual de servicios o baja calidad de imagen. Por ello:

- no se suman a las 68 pruebas automatizadas;
- no se usan para calcular una tasa actual de aprobación;
- se conservan como evidencia de evolución y como semilla de regresión;
- requieren reejecución con fecha, ambiente y evidencia.

### 31.3 Conciliación representativa

| Caso  | Estado histórico | Incidencia registrada                                                 | Lectura actual                                                       |
| ----- | ---------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| CP-01 | Passed           | Falta de respuesta háptica dificulta comprender el flujo              | Aprobado histórico con incidencia; accesibilidad pendiente           |
| CP-02 | Passed           | Simulación con ojos cubiertos y lector humano; problemas de etiquetas | No es una prueba con persona ciega ni con TalkBack                   |
| CP-03 | Passed           | El servicio debe iniciarse manualmente                                | Dependencia ambiental documentada, no defecto funcional por sí sola  |
| CP-05 | Passed           | Cámara envía imagen al análisis                                       | Requiere repetir con evidencia y oráculo semántico                   |
| CP-06 | Passed           | Lectura en voz alta                                                   | Requiere comprobar claridad y control del usuario                    |
| CP-08 | Passed           | Doble pulsación cancela análisis                                      | Código actual usa cancelación; falta recorrido móvil                 |
| CP-09 | Passed           | Sin validaciones y diseño por mejorar                                 | El estado contradice la incidencia; debe reejecutarse                |
| CP-10 | Passed           | Validaciones faltantes y diseño básico                                | El estado contradice el criterio completo                            |
| CP-11 | Passed           | Navegación difícil y poca accesibilidad                               | No debe presentarse como aceptación de usabilidad                    |
| CP-12 | Passed           | La información no se guardaba                                         | Fallo histórico del objetivo de persistencia                         |
| CP-13 | Failed           | Incompatibilidad del servicio de base                                 | Registro histórico; la conexión actual sí fue comprobada por lectura |
| CP-14 | Passed           | Archivos creados, pero base aún ausente                               | Implementación parcial en ese momento                                |
| CP-15 | Passed           | Acceso local; faltaba integración completa                            | Implementación parcial en ese momento                                |
| CP-16 | Passed           | Primer flujo funcionaba solo con base local                           | Implementación parcial en ese momento                                |
| CP-17 | Passed           | Imagen congelada de baja calidad                                      | Aprobado con observación; calidad visual requiere criterio           |

### 31.4 Casos manuales prioritarios derivados

| ID            | Objetivo                                                   | Oráculo de aceptación                                                       |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| MAN-A11Y-01   | Recorrer bienvenida, acceso, cámara y ajustes con TalkBack | Orden lógico, nombre/rol/estado correctos y ninguna trampa de foco          |
| MAN-VOICE-01  | Mantener, dictar y soltar                                  | Señal perceptible, corte al soltar, una sola solicitud y recuperación clara |
| MAN-VOICE-02  | Soltar sin voz                                             | No enviar audio vacío; mostrar instrucción recuperable                      |
| MAN-AI-01     | Preguntar por un objeto ausente                            | No inventar presencia ni ubicación                                          |
| MAN-AI-02     | Escena ambigua                                             | Expresar incertidumbre y pedir otra captura                                 |
| MAN-CANCEL-01 | Cancelar durante procesamiento                             | Terminar solicitud, detener estados y permitir reintento                    |
| MAN-SET-01    | Cambiar preferencias                                       | Cambio perceptible, persistente y reversible                                |
| MAN-ERR-01    | Interrumpir una dependencia                                | Mensaje útil, sin datos técnicos sensibles, con reintento                   |

---

## 32. Metodología de automatización adoptada

### 32.1 Relación entre material docente y solución construida

Las presentaciones describen la automatización como un ciclo: seleccionar
casos estables y repetibles, elegir herramienta, diseñar datos y oráculos,
ejecutar, analizar fallos y mantener scripts. La implementación actual aplica
ese ciclo de esta forma:

| Fase metodológica | Aplicación en VERIA                                                        |
| ----------------- | -------------------------------------------------------------------------- |
| Selección         | Validaciones, utilidades, servicios, rutas backend y contratos estables    |
| Herramienta       | Jest para JavaScript, Node para servicios y Maestro para interacción móvil |
| Diseño            | Casos positivos, negativos, límites, fallos de dependencia y contrato      |
| Ejecución         | Suites reproducibles con salidas registradas                               |
| Análisis          | Corrección de rutas, multipart, ESM/YAML, dependencias y fallbacks         |
| Mantenimiento     | `testID`, scripts de verificación y documentación de comandos              |

### 32.2 Por qué se combinan técnicas

Jest y Node ofrecen rapidez para lógica y contratos. Maestro describe
recorridos de interfaz y la pulsación sostenida, pero los cuatro flujos solo
fueron validados de forma estática porque no existe evidencia de ejecución en
un dispositivo durante este corte. Las pruebas manuales siguen siendo
necesarias para:

- percepción del audio y vibración;
- orden de foco y gestos del lector de pantalla;
- comodidad táctil;
- calidad de una descripción en contexto;
- incertidumbre y seguridad de la respuesta.

Automatización y evaluación humana son complementarias. Ninguna de las dos
debe utilizarse para declarar cobertura que pertenece a la otra.

### 32.3 Técnicas de diseño aplicables

| Técnica                   | Aplicación concreta                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Partición de equivalencia | Correo válido/inválido, contraseña válida/inválida, archivo con/sin audio               |
| Valores límite            | Tamaño máximo de audio, duración cero, límites JSON y longitud de campos                |
| Tabla de decisión         | Permiso concedido/denegado, archivo legible/ilegible, servicio disponible/no disponible |
| Transición de estados     | Inactivo → grabando → procesando → respuesta/error/cancelado                            |
| Basada en riesgo          | Priorizar alucinación, privacidad, autenticación y recuperación                         |
| Exploratoria              | Ruido, iluminación, orientación, pronunciación y gestos reales                          |

### 32.4 Criterios de entrada y salida

**Entrada para una ejecución automatizada:**

- dependencias instaladas;
- variables de prueba configuradas sin exponer secretos;
- servicios requeridos disponibles o simulados explícitamente;
- fixtures y modelos identificados;
- repositorio en un estado conocido.

**Salida mínima del ciclo actual:**

- 68 pruebas aprobadas;
- `expo-doctor` 21/21;
- lint y formato aprobados;
- auditoría del backend sin avisos;
- incidencias semánticas conservadas como abiertas;
- flujos Maestro rotulados como no ejecutados mientras falte dispositivo.

---

## 33. Planeación PERT y calendario

### 33.1 Interpretación correcta

El archivo PERT registra estimaciones optimista `O`, más probable `M` y
pesimista `P`. El tiempo esperado y la desviación estándar se calculan así:

```text
TE = (O + 4M + P) / 6
DE = (P - O) / 6
```

Estas cifras son estimaciones de planeación. No son horas registradas ni
duraciones medidas durante las pruebas.

### 33.2 Paquetes de calidad relevantes

| Paquete                | Dependencia declarada | O   | M   | P   | TE    | DE   |
| ---------------------- | --------------------- | --- | --- | --- | ----- | ---- |
| Plan de pruebas        | Especificación        | 13  | 16  | 20  | 16.17 | 1.17 |
| Pruebas unitarias      | Módulos funcionales   | 52  | 58  | 68  | 58.67 | 2.67 |
| Pruebas de integración | Pruebas unitarias     | 30  | 34  | 40  | 34.33 | 1.67 |
| Pruebas de sistema     | Integración           | 6   | 9   | 14  | 9.33  | 1.33 |
| Aceptación de usuario  | Sistema               | 8   | 10  | 14  | 10.33 | 1.00 |

La mayor estimación corresponde a pruebas unitarias por el número de módulos.
La incertidumbre también es mayor en ese paquete. El orden de dependencia
propone avanzar de componente a integración, sistema y aceptación. El estado
real no coincide por completo con ese orden: ya existen suites de componente e
integración, mientras la ejecución móvil y la aceptación permanecen
pendientes.

### 33.3 Calendario y control

El libro contiene actividades distribuidas en junio y julio junto con un
organigrama visual. Las fechas son un registro de planeación, no evidencia de
que una prueba se ejecutó en el día indicado. Para el documento ampliado, cada
actividad del calendario debe vincular:

- identificador de tarea;
- responsable;
- dependencia;
- entregable;
- fecha prevista;
- fecha real;
- evidencia;
- desviación y causa.

PERT y calendario deben mantenerse separados: PERT modela incertidumbre y
dependencias; el calendario asigna fechas. Ninguno sustituye el registro de
ejecución.

---

## 34. Modelo conceptual de datos

### 34.1 Figura aportada

[[FIGURE:database-conceptual-model]]

La figura presenta siete entidades: Usuarios, Accesibilidad, Auditivas,
Hápticas, Interacciones, Imágenes y Errores. El usuario funciona como entidad
central; imágenes y errores se relacionan con la cuenta, y las preferencias se
separan por dimensión.

### 34.2 Catálogo normalizado

| Entidad conceptual | Finalidad                     | Datos destacados                                | Cardinalidad recomendada                          |
| ------------------ | ----------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| Usuarios           | Identidad y estado de cuenta  | nombre, correo, contraseña, fechas, estado      | Una cuenta por usuario                            |
| Accesibilidad      | Preferencias visuales         | tema, tamaño, contraste y fuente                | Usuario 1:1 preferencias visuales                 |
| Auditivas          | Preferencias de audio         | volumen, velocidad, idioma y voz                | Usuario 1:1 preferencias auditivas                |
| Hápticas           | Preferencias de vibración     | activación, intensidad y patrones               | Usuario 1:1 preferencias hápticas                 |
| Interacciones      | Preferencias y comportamiento | confirmaciones, manos libres, gestos, historial | Usuario 1:1 perfil o 1:N eventos, según propósito |
| Imágenes           | Metadatos de capturas         | ubicación, tamaño, tipo, fechas y prioridad     | Usuario 1:N imágenes                              |
| Errores            | Incidentes asociados          | fecha, descripción, módulo, tipo y severidad    | Usuario 1:N errores                               |

### 34.3 Revisión del diseño

El modelo es útil como mapa de dominio, pero todavía no debe presentarse como
esquema físico comprobado. La verificación de conexión confirmó MySQL 9.4.0 y
un total de siete tablas; no se inspeccionaron columnas, llaves ni restricciones
en esa ejecución.

Antes de convertir la figura en migraciones se deben resolver:

- **Dirección de llaves:** las preferencias probablemente deben referenciar a
  `usuario_id`, evitando que Usuarios almacene cuatro llaves opcionales;
- **Cardinalidad de Interacciones:** separar preferencias estables de un
  historial potencialmente múltiple;
- **Tipos:** reemplazar `Numero`, `Texto`, `Fecha` y `Type` por tipos SQL
  concretos, tamaños, nulabilidad y valores permitidos;
- **Nombres:** usar una convención sin espacios, tildes ni variaciones singular/
  plural;
- **Contraseña:** almacenar solo un hash, nunca texto recuperable;
- **Material capturado:** decidir si se conserva archivo, URI o metadatos y
  definir eliminación;
- **Errores:** agregar código, contexto seguro, estado y correlación sin guardar
  secretos;
- **Integridad:** definir índices únicos, llaves foráneas, borrado y
  actualización;
- **Auditoría:** agregar fechas de creación/actualización cuando sean
  necesarias.

### 34.4 Modelo lógico mínimo propuesto para validación

| Tabla                    | Llave principal          | Relaciones esenciales                     | Restricciones mínimas                            |
| ------------------------ | ------------------------ | ----------------------------------------- | ------------------------------------------------ |
| usuarios                 | `usuario_id`             | Padre de preferencias, imágenes y errores | correo único; hash obligatorio; estado enumerado |
| preferencias_visuales    | `usuario_id` o ID propio | FK única a usuarios                       | contraste/tamaño dentro de rangos                |
| preferencias_auditivas   | `usuario_id` o ID propio | FK única a usuarios                       | volumen y velocidad dentro de rangos             |
| preferencias_hapticas    | `usuario_id` o ID propio | FK única a usuarios                       | patrón e intensidad validados                    |
| preferencias_interaccion | `usuario_id` o ID propio | FK única a usuarios                       | booleanos y sensibilidad validados               |
| imagenes                 | `imagen_id`              | FK a usuarios si existe sesión            | metadatos, finalidad y caducidad                 |
| errores                  | `error_id`               | FK opcional a usuarios                    | severidad, módulo, código y fecha                |

La propuesta debe compararse con `SHOW CREATE TABLE` o una exportación de
esquema sin datos personales antes de adoptarse. Hasta entonces, cualquier
equivalencia entre los nombres de la figura y las siete tablas conectadas es
una inferencia.

---

## 35. Guía de continuidad para el documento ampliado

### 35.1 Uso de las fuentes sin duplicación

El documento de aproximadamente 200 páginas debe ampliar evidencia, no repetir
definiciones. Se recomienda asignar cada fuente a un capítulo primario:

| Familia de fuentes             | Capítulo primario                     | Uso secundario              |
| ------------------------------ | ------------------------------------- | --------------------------- |
| Perfil y análisis del proyecto | Problema, alcance, roles y requisitos | Trazabilidad                |
| Instrumentos e entrevista      | Investigación con usuarios            | Accesibilidad y aceptación  |
| Material de pruebas            | Metodología y plantillas              | Justificación de técnicas   |
| Excel de casos                 | Historia de pruebas manuales          | Regresión y lecciones       |
| PERT y calendario              | Planeación y estimación               | Riesgos y control           |
| Diseño y modelo de datos       | Arquitectura y datos                  | Privacidad y mantenibilidad |
| Código y salidas               | Implementación y resultados           | Apéndices reproducibles     |

### 35.2 Matriz de afirmaciones

Antes de redactar cada capítulo, el siguiente chat debe crear una matriz con:

| Campo           | Descripción                                 |
| --------------- | ------------------------------------------- |
| Afirmación      | Enunciado que se pretende publicar          |
| Fuente primaria | Archivo, código o ejecución que lo sostiene |
| Fecha de corte  | Momento al que aplica                       |
| Nivel           | A, B, C o D                                 |
| Contradicción   | Fuente que discrepa y explicación           |
| Estado          | Confirmada, inferida o pendiente            |
| Destino         | Capítulo, tabla o apéndice                  |

Una afirmación cuantitativa no debe pasar al cuerpo si carece de ejecución,
unidad, ambiente y fecha. Las tasas calculadas sobre CP-01–CP-17 deben
rotularse como históricas y no mezclarse con Jest.

### 35.3 Estructura sugerida de anexos documentales

- Anexo A: inventario, hashes y control de versiones de fuentes;
- Anexo B: requisitos históricos y requisitos normalizados;
- Anexo C: instrumentos de entrevista sin datos identificables;
- Anexo D: catálogo CP-01–CP-17 con conciliación;
- Anexo E: catálogo de 68 pruebas automatizadas;
- Anexo F: flujos Maestro y estado de ejecución;
- Anexo G: PERT, calendario y registro de desviaciones;
- Anexo H: modelo conceptual y diccionario lógico;
- Anexo I: incidencias, correcciones y evidencia;
- Anexo J: comandos reproducibles y salidas depuradas.

### 35.4 Lista de control editorial

1. ¿Cada resultado distingue ejecución actual de registro histórico?
2. ¿Toda persona participante está anonimizada?
3. ¿Las cifras coinciden entre resumen, tablas y conclusiones?
4. ¿Los diagramas tienen título, fuente, explicación y texto alternativo?
5. ¿Las capturas ocultan correos, contraseñas, tokens y direcciones sensibles?
6. ¿Los requisitos ambiguos tienen criterio medible?
7. ¿Las incidencias contradictorias siguen visibles?
8. ¿Las conclusiones responden a evidencia y no a intención?
9. ¿Los duplicados se citan como variantes y no como validaciones múltiples?
10. ¿Todo borrador posterior al corte está claramente rotulado?

---

## 36. Cierre

El estado actual es técnicamente reproducible y considerablemente más robusto
que el punto de partida: la grabación ya viaja como archivo nativo, Whisper
recibe un formato normalizado, el backend controla errores y tamaños, la
interfaz tiene selectores accesibles y 68 pruebas automatizadas pasan.

La conclusión de calidad debe conservar dos ideas a la vez. La infraestructura
de voz funciona de extremo a extremo para la muestra registrada, pero la
respuesta visual todavía puede inventar objetos o posiciones. Por tanto, el
siguiente criterio de madurez no es obtener otro HTTP 200, sino demostrar con
un corpus anotado y usuarios que las respuestas son prudentes, útiles y
seguras.
