# Data Model

## Entity-Storage Map

| Entity | Storage | Table |
|--------|---------|-------|
| User | D1 | users |
| Tenant | D1 | tenants |
| Item | D1 | items |
| Record | D1 | records |

## Notes

- users and tenants follow multi-tenant pattern with tenant_id
- items and records are product-specific entities
