<#ftl output_format="plainText">
<#assign attributes = user.getAttributes()>
<#assign applicationRole = attributes.applicationRole!"VIEWER">
<#assign applicationDepartment = attributes.applicationDepartment!"Unassigned">
Hello ${user.firstName!user.username},

An administrator created a Digital Archive account for you.

Username: ${user.username}
Role: ${applicationRole?replace("_", " ")?lower_case?cap_first}
Department: ${applicationDepartment}

Use the secure link below to verify your email address and choose a private
password. No password has been created for you; only you will know the password
you set through this link.

${link}

This link expires in ${linkExpirationFormatter(linkExpiration)}.

If you were not expecting this account, contact your system administrator.
