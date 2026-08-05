<#assign attributes = user.getAttributes()>
<#assign applicationRole = attributes.applicationRole!"VIEWER">
<#assign applicationDepartment = attributes.applicationDepartment!"Unassigned">

<#import "template.ftl" as layout>
<@layout.emailLayout>
  <p>Hello ${user.firstName!user.username},</p>
  <p>An administrator created a Digital Archive account for you.</p>
  <p>
    <strong>Username:</strong> ${user.username}<br>
    <strong>Role:</strong> ${applicationRole?replace("_", " ")?lower_case?cap_first}<br>
    <strong>Department:</strong> ${applicationDepartment}
  </p>
  <p>
    Use the secure link below to verify your email address and choose a private
    password. No password has been created for you; only you will know the
    password you set through this link.
  </p>
  <p>
    <a href="${link}">Verify email and set password</a>
  </p>
  <p>This link expires in ${linkExpirationFormatter(linkExpiration)}.</p>
  <p>If you were not expecting this account, contact your system administrator.</p>
</@layout.emailLayout>
