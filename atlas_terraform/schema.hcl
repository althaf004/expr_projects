variable "my_var" {
  default = "Hello, World!"
}

resource "null_resource" "example" {
  triggers = {
    current_time = timestamp()
    message     = var.my_var
  }

  provisioner "local-exec" {
    when    = "create"
    command = "echo ${timestamp()}"
  }
}
