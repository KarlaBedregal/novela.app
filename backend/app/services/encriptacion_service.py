"""
M5 (V1) — Envelope Encryption para manuscritos.

Arquitectura:
  Contraseña/frase del usuario → Argon2id → KEK (Key Encryption Key)
  KEK → descifra → DEK (Data Encryption Key, única por manuscrito)
  DEK → cifra/descifra → texto del manuscrito (AES-256-GCM)

El servidor nunca almacena el KEK. Solo guarda la DEK cifrada.
Sin la contraseña del usuario, los manuscritos son ilegibles.

Recuperación:
  3 frases personales del autor → 3 copias independientes de la DEK.
  Con recordar 1 de las 3 frases basta para recuperar el acceso.
"""
import os
import struct
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from argon2.low_level import hash_secret_raw, Type


# Parámetros Argon2id (lentos por diseño: resistentes a ataques de fuerza bruta)
ARGON2_TIME_COST   = 3
ARGON2_MEMORY_COST = 65536  # 64 MB
ARGON2_PARALLELISM = 2
ARGON2_HASH_LEN    = 32
ARGON2_SALT_LEN    = 16


def derivar_kek(frase: str, salt: bytes) -> bytes:
    """Deriva el KEK a partir de una frase usando Argon2id."""
    return hash_secret_raw(
        secret=frase.encode("utf-8"),
        salt=salt,
        time_cost=ARGON2_TIME_COST,
        memory_cost=ARGON2_MEMORY_COST,
        parallelism=ARGON2_PARALLELISM,
        hash_len=ARGON2_HASH_LEN,
        type=Type.ID,
    )


def generar_dek() -> bytes:
    """Genera una DEK aleatoria de 256 bits."""
    return os.urandom(32)


def cifrar_dek(dek: bytes, kek: bytes) -> bytes:
    """Cifra la DEK con el KEK usando AES-256-GCM. Retorna salt + nonce + ciphertext."""
    nonce = os.urandom(12)
    aesgcm = AESGCM(kek)
    ct = aesgcm.encrypt(nonce, dek, None)
    return nonce + ct  # 12 + 32 + 16 bytes = 60 bytes


def descifrar_dek(dek_cifrada: bytes, kek: bytes) -> bytes:
    """Descifra la DEK. Lanza excepción si el KEK es incorrecto."""
    nonce = dek_cifrada[:12]
    ct    = dek_cifrada[12:]
    aesgcm = AESGCM(kek)
    return aesgcm.decrypt(nonce, ct, None)


def cifrar_texto(texto: str, dek: bytes) -> bytes:
    """Cifra el texto del manuscrito con la DEK. Retorna nonce + ciphertext."""
    nonce = os.urandom(12)
    aesgcm = AESGCM(dek)
    ct = aesgcm.encrypt(nonce, texto.encode("utf-8"), None)
    return nonce + ct


def descifrar_texto(datos: bytes, dek: bytes) -> str:
    """Descifra el texto del manuscrito."""
    nonce = datos[:12]
    ct    = datos[12:]
    aesgcm = AESGCM(dek)
    return aesgcm.decrypt(nonce, ct, None).decode("utf-8")


def preparar_recuperacion(dek: bytes, frases: list[str]) -> list[dict]:
    """
    Crea 3 copias independientes de la DEK, cada una cifrada con una frase diferente.
    El autor solo necesita recordar 1 de las 3 para recuperar el acceso.

    Retorna lista de {salt_hex, dek_cifrada_hex} para guardar en DB.
    """
    copias = []
    for frase in frases:
        salt = os.urandom(ARGON2_SALT_LEN)
        kek  = derivar_kek(frase, salt)
        dek_c = cifrar_dek(dek, kek)
        copias.append({
            "salt":        salt.hex(),
            "dek_cifrada": dek_c.hex(),
        })
    return copias
