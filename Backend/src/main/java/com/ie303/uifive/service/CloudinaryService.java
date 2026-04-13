package com.ie303.uifive.service;

import com.cloudinary.Cloudinary;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@AllArgsConstructor
public class CloudinaryService {
    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) {
        return uploadFile(file, "learning-app");
    }

    public String uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "resource_type", "auto",
                            "folder", folder
                    )
            );

            return result.get("secure_url").toString();

        } catch (Exception e) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Failed to upload file to Cloudinary");
        }
    }
}
