# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.3/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.0.3/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/4.0.3/reference/web/servlet.html)
* [Spring Boot DevTools](https://docs.spring.io/spring-boot/4.0.3/reference/using/devtools.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.0.3/reference/data/sql.html#data.sql.jpa-and-spring-data)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

### VNPay IPN with ngrok (local dev)

1. Start backend on port `8080`.
2. Run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\start-ngrok.ps1 -Port 8080
   ```
3. Copy `VNPAY_IPN_URL=...` from console and set it in VNPay sandbox merchant as IPN/Notify URL.
4. Keep ngrok process running while testing payment.

### Fix BANK provider constraint (PostgreSQL)

If checkout with provider `BANK` fails with:
`payment_transactions_provider_check`, run:

```sql
\i scripts/sql/fix-payment-provider-constraint.sql
```

Or execute file content directly in your SQL editor.

### Swagger / OpenAPI

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

For secured endpoints, click `Authorize` in Swagger UI and use:
`Bearer <your_jwt_token>`

