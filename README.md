# LOGIT

## Inicio

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env`.
3. Define `ADMIN_EMAIL` y una `ADMIN_PASSWORD` propia de al menos 12 caracteres.
4. Inicia el servidor con `npm start` y abre `http://localhost:3000`.

La cuenta administradora se crea en SQLite al iniciar el servidor por primera vez.
Las contraseñas se almacenan con hash y las rutas de datos de la API requieren
una sesión autenticada. El registro público está deshabilitado.

## Acceso de clientes

Desde **Clientes**, el administrador puede crear o restablecer el acceso de un
cliente registrado. El correo del cliente es su usuario; la contraseña temporal
se muestra una sola vez y debe compartirse de forma privada. Al iniciar sesión,
el cliente debe definir una contraseña propia antes de continuar. En su portal
puede consultar sus pedidos, actualizar sus datos de contacto y confirmar la
recepción cuando el envío figure como llegado a su domicilio.

No compartas ni subas `.env`; contiene las credenciales locales.

## Despacho y portal de conductores

En **Despacho diario**, filtra por municipio, selecciona paquetes pendientes y
asigna un conductor activo y un vehículo disponible. Esto crea una ruta
planeada y reserva sus paquetes. El conductor puede consultar la asignación e
iniciar el viaje desde **Mi ruta** cuando realmente esté listo para salir; al
iniciarlo, se crean las entregas.

Desde cada parada, el conductor puede registrar la llegada (el cliente conserva
la confirmación de recepción) o informar una novedad. Una visita fallida queda
en el historial y el paquete vuelve a la cola de despacho para intentarlo en
otra ruta. El conductor debe visitar todas las paradas o informar una novedad
antes de finalizar el recorrido.

El cliente también puede confirmar la recepción cuando el conductor registre
la llegada o reportar que el paquete llegó dañado. El reporte queda como una
incidencia para que el administrador coordine y registre la devolución; los
estados no se cambian manualmente desde la ficha general del paquete.

El administrador crea o restablece el acceso individual desde **Conductores**.
El correo registrado es el usuario; la contraseña temporal se muestra una sola
vez y el conductor debe cambiarla en el primer ingreso. El portal muestra la
ruta planeada o activa asociada a la cuenta autenticada.

## Operación de demostración en el Meta

`npm run seed` prepara 10 clientes, 5 vehículos, 5 conductores, 5 rutas,
10 paquetes y 4 entregas de ejemplo. Los paquetes nuevos solo aceptan
municipios del Meta. El conductor y el vehículo quedan reservados desde que se
planea una ruta; no pueden asignarse a otra hasta completarla o cancelarla. El
seed es repetible y no borra registros existentes. Para una demostración limpia,
ejecútalo sobre una base de datos vacía.

Para reemplazar los clientes, paquetes, entregas, rutas, conductores y vehículos
existentes por los datos de demostración, primero detén el servidor y ejecuta
`npm run seed -- --reset`. El comando crea un respaldo SQLite junto al archivo
de base de datos antes de hacer el reemplazo, y conserva las cuentas de
administrador. No borres el respaldo hasta comprobar la aplicación.
