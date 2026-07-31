package com.digitalarchive.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TransitionRequest {
    @Size(max = 5000)
    private String comment; // required on rejection, optional otherwise
}
