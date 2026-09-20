# DECISIONES

## 1 · Qué construí y qué dejé fuera

Webhook NestJS al estilo Twilio, intención por reglas, casos en Postgres (un contacto; a lo sumo una CONSULTA y un RECLAMO abiertos), respuestas desde seed, panel Next.js, Jest y un Playwright. Plus: puerto de mensajería (`db` / `twilio`), Compose y Basic auth con bcrypt. Dejé fuera el LLM, reabrir casos cerrados y la entrega real a WhatsApp en cuenta trial: el texto sí queda en el panel.

## 2 · Sección 6

1. «Reclamo porque espero respuesta de inscripción» es **RECLAMO**. Las reglas priorizan `reclamo|queja|denuncia`; el bot confirma el caso y no mezcla el FAQ de inscripción. Si solo quería fechas, que lo escriba sin hablar de reclamo.
2. Un caso **CERRADO no se reabre**. El próximo mensaje abre otro del mismo tipo. El historial cerrado se conserva; el equipo no se encuentra un hilo que creía terminado.
3. «¿Cuándo pago?» cae en **FECHAS_PAGO** (`pago|pagar|cuota`) y responde el calendario seed (matrícula y cuotas). No pregunto de vuelta: en un bot de un turno, aclarar cuesta más que mandar el bloque corto.
4. Fechas hoy y reclamo mañana son **dos casos**. CONSULTA y RECLAMO conviven; el panel los lista aparte. Un solo caso que cambia de tipo escondería el reclamo detrás de una consulta.

## 3 · Robustez

**5.1** `messages.providerSid` es único. Si el `MessageSid` ya existe, no inserto, no abro otro caso y no vuelvo a enviar. Lo cubre un test que llama al webhook dos veces con el mismo payload.

**5.2** El riesgo es que dos mensajes del mismo número entren a la vez, los dos vean que no hay caso abierto y los dos creen uno. Lo evito con un índice único en Postgres: un solo `(contacto, tipo)` mientras el caso no esté `CERRADO`. Si los dos intentan crear, la base rechaza al segundo y el código lee el caso que sí quedó. No usé un lock en Node: se pierde al reiniciar y no sirve con dos instancias.

**5.3** Persisto el inbound **antes** de hablar con el proveedor. Si el envío falla, el hilo queda consistente y el webhook igual responde 200, para que Twilio no reintente y volvamos al 5.1. No hay cola de reintento: el panel tiene el mensaje; WhatsApp puede no tener la respuesta. En la cuenta trial eso pasa siempre con texto libre: la API REST pide plantilla (`ContentSid`) y el fallback TwiML tampoco entrega el body de la base.

## 4 · Algo que descarté

Clasificar con un LLM. El brief pide reglas testeables; un modelo suma latencia, costo y un fallo más en el webhook. También descarté un caso por teléfono que cambia de tipo: más simple en tabla de base de datos, peor para el equipo que filtra reclamos.

## 5 · Lo que menos entiendo de mi propia entrega

El camino Twilio. El adapter y el fallback TwiML están en el código; en trial no vi el texto custom llegar a WhatsApp. Si eso se rompe en una demo, no tengo un segundo canal real para aislar si el problema es la plantilla, el sandbox o nuestro XML.

## 6 · Con una semana más

Una cola para reenviar salientes cuando el proveedor vuelva. Un upgrade posible es pasar de la trial al servicio de paga de Twilio: ahí sí se puede mandar el body libre a WhatsApp, sin plantilla ni TwiML.
