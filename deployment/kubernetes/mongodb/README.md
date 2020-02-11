

Creating the user

```sh
db.createUser({
	user: "digitalpoints",
	pwd: "purplebox",
	roles:[{role: "userAdminAnyDatabase" , db:"admin"}],
	passwordDigestor:"server"
})

db.grantRolesToUser("digitalpoints",
	{ role: "admin", db: "digitalpoints" }
)
```
