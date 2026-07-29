package com.digitalarchive.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageLocation;

    public FileStorageService(@Value("${app.file-storage.location}") String location) throws IOException {
        this.storageLocation = Paths.get(location).toAbsolutePath().normalize();
        Files.createDirectories(this.storageLocation);
    }

    public record StoredFile(String storedFileName, String filePath, String checksumSha256, long fileSize) {
    }

    public StoredFile store(MultipartFile file) {
        try {
            String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path targetPath = storageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String checksum = computeSha256(targetPath);
            long size = Files.size(targetPath);

            return new StoredFile(storedFileName, targetPath.toString(), checksum, size);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Path resolve(String storedFileName) {
        return storageLocation.resolve(storedFileName);
    }

    private String computeSha256(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(Files.readAllBytes(path));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}