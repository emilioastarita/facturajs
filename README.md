![facturajs](facturajs.jpg?raw=true&1 "FacturaJS")

# facturajs

Afip Web Services desde nodejs.

````bash
~$ yarn add facturajs
# OR
~$ npm i facturajs
````

## WebServices de la AFIP con node  

El objetivo de esta lib es facilitar la comunicación con la AFIP utilizando node.js. En mi caso particular, necesitaba *generar facturas electrónicas como monotributista* de manera automática. 

No tiene muchas pretenciones, pero el código puede ser ilustrativo para armar otras integraciones más complejas.    

### Obtener certificados en la AFIP
  
Los servicios de AFIP están disponibles mediante SOAP y su página principal es [AFIP WS](http://www.afip.gob.ar/ws).

Los servicios poseen dos entornos conocidos como homologación (para testing), y producción.

Para utilizar ambos entornos hay que obtener certificados digitales de la AFIP.

De nuestro lado lo primero es generar certificados relacionados a nuestro CUIT:

```bash
# Crear clave privada
~ $ openssl genrsa -out private/private_key.key 2048 
# Crear certificado
~ $ openssl req -new -key private/private_key.key -subj "/C=AR/O=TU_EMPRESA/CN=TU_SISTEMA/serialNumber=CUIT TU_CUIT" -out private/afip.csr

```
(*) Dónde dice `CUIT TU_CUIT` es importante el espacio y conservar la palabra "CUIT". 

### Adherirse a homologación (testing)

En este [pdf (WSASS como adherirse)](https://www.afip.gob.ar/ws/WSASS/WSASS_como_adherirse.pdf) pueden ver el proceso de adhesión al servicio de homologación. Básicamente das de alta el servicio y le cargas el CSR generado en el paso anterior, la página web te va a entregar otro cert que lo tenes que copiar y lo guardas en un archivo de texto: `private/cert.pem`. El último paso, en esa misma página, sería autorizar tu cert al servicio que quieras usar. En mi caso quería el de facturas digitales llamado: `wsfe`. 

### Ejemplo de uso  


#### Crear una factura electrónica

En este ejemplo pueden [ver como crear una factura electrónica con el último número de comprobante válido](src/examples/create-bill.ts).

Para poder ver más en detalle que está sucediendo se puede configurar el `LOG_LEVEL` y namespace de `DEBUG`:

```bash
~$ LOG_LEVEL=3 DEBUG=facturajs node dist/examples/create-bill-monotributo.js
# Salida:
# Last bill number:  43
# Next bill number to create:  44
# Created bill {
#     "FeCabResp": {
#         "Cuit": "XXXXXXXXXX",
#         "PtoVta": 2,
#         "CbteTipo": 11,
#         "FchProceso": "20180423081028",
#         "CantReg": 1,
#         "Resultado": "A",
#         "Reproceso": "N"
#     },
#     "FeDetResp": {
#         "FECAEDetResponse": [
#             {
#                 "Concepto": 1,
#                 "DocTipo": 99,
#                 "DocNro": "0",
#                 "CbteDesde": "44",
#                 "CbteHasta": "44",
#                 "CbteFch": "20180423",
#                 "Resultado": "A",
#                 "CAE": "68174646182386",
#                 "CAEFchVto": "20180503"
#             }
#         ]
#     }
# }
```

#### Ejecutar cualquier método del WebService

De manera general cualquier método del WebService se puede llamar con `execRemote(servicio, método, parámetros)`, por ejemplo:

````typescript
const afip = new AfipServices(config);
afip.execRemote('wsfev1', 'FECAESolicitar', {
    Auth: {Cuit: 27000000000},
    params: {
        CbteTipo: 11,
        PtoVta: 2
    }    
}).then(res => console.log(res))
````
 
 
 
#### Config

El constructor `AfipServices` acepta un objeto que cumpla con la interfaz de `IConfigService`. La descripción de sus propiedades:

* `homo` Un booleano que determina el uso del entorno de homologación.
* `cacheTokensPath` Path a un file dónde se cachearan los tokens obtenidos para no solicitarlos cada vez.
* `tokensExpireInHours` La cantidad de horas en la que expirará el archivo de tokens cacheados.
* `privateKeyContents` El contenido de la private key (no hace falta path en este caso)
* `privateKeyPath` Path a la private key (al igual que antes podemos omitir el contenido)
* `certContents` El contenido del certificado (no hace falta path en este caso)
* `certPath` Path al certificado (al igual que antes podemos omitir el contenido)


#### Nota acerca de métodos de cifrado openssl

En algunos sistemas operativos con una versión de la configuración de openssl mas nueva
se reportó un error porque openssl rechaza los métodos de cifrado de AFIP.
Algunos usuarios reportaron que en un sistema Debian la solución fue editar `/etc/ssl/openssl.cnf`.
Y comentar la siguiente línea:
```
# CipherString = DEFAULT@SECLEVEL=2
```


#### Proyectos relacionados

- [SOAP de la AFIP a REST](https://github.com/sarriaroman/AFIP-API) enciende un server expressjs y sirve de wrapper alrededor del SOAP para poder consumir los servicios con una interfaz REST. A partir de ese repo se armó esta lib.


#### Colaboradores

* mbenedettini 
