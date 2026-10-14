"""Compatibilidad: todas las invitaciones se generan en la carpeta única oficial."""

from generar_autonomas import generate_autonomous_invitations


def generate_invitations():
    generate_autonomous_invitations()


if __name__ == "__main__":
    generate_invitations()
