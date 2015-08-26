import React from 'react/addons'

export class HelpBox extends React.Component {
        render() {
                return (<div key={2}>
                        <h4>NPM setup</h4>
                        <p>By default are artifacts downloaded with TLS from <a href="http://registry.npmjs.org">registry.npmjs.org</a>.
                        </p>
                        <p>To achieive a MITM proxy there are some options:
                                <ul>
                                        <li>disable certificate verification with <span className="raw">npm config strict-ssl false</span>
                                                or <span className="raw">npm --strict-ssl false install</span></li>
                                        <li>npm --strict-ssl false install</li>
                                </ul>
                        </p>


                        <h4>Apache Maven setup</h4>
                        <p>By default are artifacts downloaded from Maven Central at <a
                            href="http://repo.maven.apache.org">repo.maven.apache.org</a>. Version 3.2.6
                                and later will use TLS for acessing the site, earlier versions raw HTTP.</p>
                        <p>A succesful TLS setup requires injecting the MITM certification in the <span className="raw">$JAVA_HOME/jre/lib/security/cacert</span>
                                file of the JVM used to run Maven:</p>

                        <div className="raw">
                                keytool -storepass changeit -noprompt -import -alias docker-mitm-proxy -keystore cacerts
                                -file \ <br/>
                                &lt;&#40;echo "-----BEGIN CERTIFICATE----- <br/>
                                MIIDhTCCAm2gAwIBAgIJAM96zDV4f1agMA0GCSqGSIb3DQEBCwUAMFkxCzAJBgNV<br/>
                                BAYTAk5PMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX<br/>
                                aWRnaXRzIFB0eSBMdGQxEjAQBgNVBAMMCU1JVE1QUk9YWTAeFw0xNTA4MTQxMDEy<br/>
                                MjJaFw0xODA2MDMxMDEyMjJaMFkxCzAJBgNVBAYTAk5PMRMwEQYDVQQIDApTb21l<br/>
                                LVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQxEjAQBgNV<br/>
                                BAMMCU1JVE1QUk9YWTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMkD<br/>
                                BAZGJkhTvgbnGEyvAxBQ6GwfP4XBD+668//UxH1ypIOExRDlbVzN9dtKuWZBCtHD<br/>
                                9++7GPQerRNKp1mRLYLvKLvaK7Fnq6Bix8m0h1rhGqPfpF5nPibva6YnfaG99c7R<br/>
                                Iq5USDUp0M0y+G92rDvKv6qFxElFynSLQsZ47UlGTz2GzVox4+GwHMSz3D3qZUEs<br/>
                                CviYEjzkXJgfnMBHzCzqPoTYJjLyH+dNpIyRb69wXapjor89ZgrTFcN6hUDUyXTk<br/>
                                UAX7TL3hQbTD1foDFh0LGa5uFNlRFQcIociBNtS64U3rQHeep5DxkS1PXOrFrhQj<br/>
                                TlpHjnjTFM0H5d2LnIUCAwEAAaNQME4wHQYDVR0OBBYEFCI+rfIiRK+0aDRacQ2W<br/>
                                5RJhMsApMB8GA1UdIwQYMBaAFCI+rfIiRK+0aDRacQ2W5RJhMsApMAwGA1UdEwQF<br/>
                                MAMBAf8wDQYJKoZIhvcNAQELBQADggEBAAsjjlTY1RW2+h22aOOsYN+DXNgcy7BU<br/>
                                v+LMmoZd4r/LfvsR4GegulCpZrA6MtXQ9XUjGUASQ+JT8cdoKJxxU4xAnqaDpo+1<br/>
                                MFO6jYewSCSiLXe8cL3ugBP0DzckjhhrWtDSgupPWZRFDLaiHTL0Bh+Nn2uNRAqi<br/>
                                MdrhLTpgKZQZE/JybTVn6Z0JHuRvTh/3K3QoI8izP0eq+xaURMZH8sN73jKvwfn5<br/>
                                1eJ++Qjvydlh/z7JkEGlKQAnOABdGBXF75xU3DvsOBN1HC7O9UlKuDbWqY2QxSqd<br/>
                                dtAW9S41Jo8KfC9g6JvZaE48DNrQAOdVbgCcOPor4uMjmESegaWTwFU= <br/>
                                -----END CERTIFICATE-----" &#41;                                <br/>
                        </div>
                        <h4>CURL</h4>
                        <p>When accessing https URLs with curl one can:
                                <ul>
                                        <li>disable certificate verification with the <span className="raw">-k</span>/<span
                                            className="raw">--insecure</span> option
                                        </li>
                                        <li>refer to the proxy CA certificate with <span className="raw">--cacert rootCA.pem</span>
                                        </li>
                                </ul>
                        </p>


                </div>);

        }
}
