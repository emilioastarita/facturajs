/**
 * Trimmed-down stand-in for AFIP's wsfev1 WSDL: just enough of
 * `FECompUltimoAutorizado` for soap to build a client and a request envelope.
 */
export function buildWsdl(baseUrl: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<wsdl:definitions xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
                  xmlns:tns="http://ar.gov.afip.dif.FEV1/"
                  xmlns:s="http://www.w3.org/2001/XMLSchema"
                  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
                  targetNamespace="http://ar.gov.afip.dif.FEV1/">
  <wsdl:types>
    <s:schema elementFormDefault="qualified" targetNamespace="http://ar.gov.afip.dif.FEV1/">
      <s:element name="FECompUltimoAutorizado">
        <s:complexType>
          <s:sequence>
            <s:element minOccurs="0" maxOccurs="1" name="Auth">
              <s:complexType>
                <s:sequence>
                  <s:element minOccurs="0" maxOccurs="1" name="Token" type="s:string"/>
                  <s:element minOccurs="0" maxOccurs="1" name="Sign" type="s:string"/>
                  <s:element minOccurs="1" maxOccurs="1" name="Cuit" type="s:long"/>
                </s:sequence>
              </s:complexType>
            </s:element>
            <s:element minOccurs="1" maxOccurs="1" name="PtoVta" type="s:int"/>
            <s:element minOccurs="1" maxOccurs="1" name="CbteTipo" type="s:int"/>
          </s:sequence>
        </s:complexType>
      </s:element>
      <s:element name="FECompUltimoAutorizadoResponse">
        <s:complexType>
          <s:sequence>
            <s:element minOccurs="0" maxOccurs="1" name="FECompUltimoAutorizadoResult">
              <s:complexType>
                <s:sequence>
                  <s:element minOccurs="1" maxOccurs="1" name="PtoVta" type="s:int"/>
                  <s:element minOccurs="1" maxOccurs="1" name="CbteTipo" type="s:int"/>
                  <s:element minOccurs="1" maxOccurs="1" name="CbteNro" type="s:int"/>
                </s:sequence>
              </s:complexType>
            </s:element>
          </s:sequence>
        </s:complexType>
      </s:element>
    </s:schema>
  </wsdl:types>
  <wsdl:message name="FECompUltimoAutorizadoSoapIn">
    <wsdl:part name="parameters" element="tns:FECompUltimoAutorizado"/>
  </wsdl:message>
  <wsdl:message name="FECompUltimoAutorizadoSoapOut">
    <wsdl:part name="parameters" element="tns:FECompUltimoAutorizadoResponse"/>
  </wsdl:message>
  <wsdl:portType name="ServiceSoap">
    <wsdl:operation name="FECompUltimoAutorizado">
      <wsdl:input message="tns:FECompUltimoAutorizadoSoapIn"/>
      <wsdl:output message="tns:FECompUltimoAutorizadoSoapOut"/>
    </wsdl:operation>
  </wsdl:portType>
  <wsdl:binding name="ServiceSoap" type="tns:ServiceSoap">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
    <wsdl:operation name="FECompUltimoAutorizado">
      <soap:operation soapAction="http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado" style="document"/>
      <wsdl:input><soap:body use="literal"/></wsdl:input>
      <wsdl:output><soap:body use="literal"/></wsdl:output>
    </wsdl:operation>
  </wsdl:binding>
  <wsdl:service name="Service">
    <wsdl:port name="ServiceSoap" binding="tns:ServiceSoap">
      <soap:address location="${baseUrl}/wsfev1/service.asmx"/>
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>`;
}

export const LAST_BILL_RESPONSE = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <FECompUltimoAutorizadoResponse xmlns="http://ar.gov.afip.dif.FEV1/">
      <FECompUltimoAutorizadoResult>
        <PtoVta>1</PtoVta>
        <CbteTipo>6</CbteTipo>
        <CbteNro>42</CbteNro>
      </FECompUltimoAutorizadoResult>
    </FECompUltimoAutorizadoResponse>
  </soap:Body>
</soap:Envelope>`;
